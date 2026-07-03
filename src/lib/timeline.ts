import { evaluate } from './points';
import { isYm } from './types';
import type { JobAssessment, PlanningDates, SharedCriteria } from './types';
import { assessingAuthority } from '@/data/assessingAuthorities';

// —— month math ——————————————————————————————————————————————————————————————

const toN = (ym: string): number => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
};

const fromN = (n: number): string =>
  `${String(Math.floor(n / 12)).padStart(4, '0')}-${String((n % 12) + 1).padStart(2, '0')}`;

export const addMonths = (ym: string, n: number): string => fromN(toN(ym) + n);

/** NAATI CCL expiry month: 5 years for credentials issued >= 2022-08, 3 years before (naati.com.au) */
export const naatiExpiryMonth = (cert: string): string => addMonths(cert, cert >= '2022-08' ? 60 : 36);

/** Returns b − a in whole months (signed). */
export const monthsBetween = (a: string, b: string): number => toN(b) - toN(a);

const fullYears = (from: string, at: string): number =>
  Math.floor(Math.max(0, monthsBetween(from, at)) / 12);

// —— bracket derivation ——————————————————————————————————————————————————————

const AGE_BRACKETS: [min: number, max: number, value: string][] = [
  [18, 24, '18-24'],
  [25, 32, '25-32'],
  [33, 39, '33-39'],
  [40, 44, '40-44'],
];

const ageValue = (years: number): string =>
  AGE_BRACKETS.find(([min, max]) => years >= min && years <= max)?.[2] ?? '';

const ausWorkValue = (y: number): string =>
  y >= 8 ? '8-10' : y >= 5 ? '5-8' : y >= 3 ? '3-5' : y >= 1 ? '1-3' : '';

const overseasWorkValue = (y: number): string =>
  y >= 8 ? '8-10' : y >= 5 ? '5-8' : y >= 3 ? '3-5' : '';

/**
 * Substitute date-derived bracket values as of `at`; manually entered values
 * stay untouched when no corresponding date field is set.
 */
export function applyDates(
  shared: SharedCriteria,
  jobs: JobAssessment[],
  dates: PlanningDates,
  at: string,
): { shared: SharedCriteria; jobs: JobAssessment[] } {
  const s = { ...shared };
  if (isYm(dates.birth)) s.age = ageValue(fullYears(dates.birth, at));

  const js = jobs.map((j) => {
    const out = { ...j };
    if (isYm(j.ausWorkStart)) out.ausWork = ausWorkValue(fullYears(j.ausWorkStart, at));
    if (isYm(j.overseasWorkStart)) out.overseasWork = overseasWorkValue(fullYears(j.overseasWorkStart, at));
    return out;
  });

  return { shared: s, jobs: js };
}

// —— timeline types ——————————————————————————————————————————————————————————

export interface TimelineCause {
  kind:
    | 'age'
    | 'ausWork'
    | 'overseasWork'
    | 'englishExpiry'
    | 'assessmentExpiry'
    | 'naatiExpiry'
    | 'eligibilityEnd';
  jobTag?: string;                        // 'A' | 'B' | … for per-assessment causes
  labelKey: string;                       // i18n key under tl.*
  params?: Record<string, string | number>;
}

export interface TimelineEvent {
  date: string;                           // YYYY-MM
  causes: TimelineCause[];
  delta: number;                          // score change this month (0 for pure warnings)
  scoreAfter: number;                     // bare score after this month
  warning: boolean;                       // true when every cause is an expiry
}

export interface TimelineResult {
  startScore: number;
  events: TimelineEvent[];
  horizonEnd: string;                     // YYYY-MM
  endsAt45: boolean;
}

// —— constants ———————————————————————————————————————————————————————————————

const HORIZON_MONTHS = 60;
const ENGLISH_VALIDITY_MONTHS = 36;

// Causes that carry no score change — only a user warning.
const WARNING_KINDS = new Set<TimelineCause['kind']>([
  'englishExpiry',
  'assessmentExpiry',
  'naatiExpiry',
]);

// —— buildTimeline ———————————————————————————————————————————————————————————

export function buildTimeline({
  shared,
  jobs,
  dates,
  today,
}: {
  shared: SharedCriteria;
  jobs: JobAssessment[];
  dates: PlanningDates;
  today: string;
}): TimelineResult {
  const birth45 = isYm(dates.birth) ? addMonths(dates.birth, 45 * 12) : null;
  const capped = addMonths(today, HORIZON_MONTHS);
  const endsAt45 = birth45 !== null && monthsBetween(birth45, capped) >= 0;
  const horizonEnd = endsAt45 ? birth45! : capped;

  // Only include events strictly after today and up to (inclusive) the horizon.
  const inWindow = (m: string): boolean =>
    monthsBetween(today, m) > 0 && monthsBetween(m, horizonEnd) >= 0;

  const causesByMonth = new Map<string, TimelineCause[]>();
  const push = (m: string, c: TimelineCause): void => {
    if (!inWindow(m)) return;
    causesByMonth.set(m, [...(causesByMonth.get(m) ?? []), c]);
  };

  // Age bracket changes at 25, 33 and 40; eligibility ends at 45.
  if (isYm(dates.birth)) {
    for (const target of [25, 33, 40] as const) {
      push(addMonths(dates.birth, target * 12), {
        kind: 'age',
        labelKey: `tl.age${target}`,
        params: { age: target },
      });
    }
    if (endsAt45) {
      push(birth45!, { kind: 'eligibilityEnd', labelKey: 'tl.age45', params: { age: 45 } });
    }
  }

  // Per-assessment work milestones and skills-assessment expiry.
  jobs.forEach((j, i) => {
    const tag = String.fromCharCode(65 + i); // 'A', 'B', …

    if (isYm(j.ausWorkStart)) {
      for (const y of [1, 3, 5, 8]) {
        push(addMonths(j.ausWorkStart, y * 12), {
          kind: 'ausWork',
          jobTag: tag,
          labelKey: 'tl.ausWork',
          params: { years: y },
        });
      }
    }

    if (isYm(j.overseasWorkStart)) {
      for (const y of [3, 5, 8]) {
        push(addMonths(j.overseasWorkStart, y * 12), {
          kind: 'overseasWork',
          jobTag: tag,
          labelKey: 'tl.overseasWork',
          params: { years: y },
        });
      }
    }

    if (isYm(j.assessmentDate)) {
      const info = assessingAuthority(j.anzsco);
      if (info.validityYears !== null) {
        push(addMonths(j.assessmentDate, info.validityYears * 12), {
          kind: 'assessmentExpiry',
          jobTag: tag,
          labelKey: 'tl.assessmentExpiry',
          params: { authority: info.authority },
        });
      }
    }
  });

  // English test validity: 3 years from test date.
  // Source: immi.homeaffairs.gov.au (Schedule 6D, English language criteria).
  if (isYm(dates.englishTest)) {
    push(addMonths(dates.englishTest, ENGLISH_VALIDITY_MONTHS), {
      kind: 'englishExpiry',
      labelKey: 'tl.englishExpiry',
    });
  }

  // NAATI CCL credential expiry.
  // Source: https://www.naati.com.au/news/update-to-ccl-validity/
  // Credentials issued on/after 2022-08 are valid for 5 years (60 months);
  // those issued before that date are valid for 3 years (36 months).
  // NOTE: We only emit this warning when communityLanguage is ticked, because
  // the CCL credential is how the applicant claims that bonus point item.
  if (isYm(dates.naatiCert) && shared.communityLanguage) {
    push(naatiExpiryMonth(dates.naatiCert), {
      kind: 'naatiExpiry',
      labelKey: 'tl.naatiExpiry',
    });
  }

  // Compute bare score at an arbitrary month, applying date-derived brackets.
  const scoreAt = (m: string): number => {
    const { shared: s, jobs: js } = applyDates(shared, jobs, dates, m);
    return evaluate(s, js).bareScore;
  };

  const startScore = scoreAt(today);

  // Build events: sort ascending by month, compute deltas, then filter to only
  // months that change the score, carry a warning, or mark the eligibility end.
  let prev = startScore;
  const events: TimelineEvent[] = [...causesByMonth.entries()]
    .sort(([a], [b]) => monthsBetween(b, a))   // ascending: monthsBetween(b, a) = toN(a) − toN(b)
    .map(([date, causes]) => {
      const scoreAfter = scoreAt(date);
      const delta = scoreAfter - prev;
      prev = scoreAfter;
      const warning = causes.every((c) => WARNING_KINDS.has(c.kind));
      return { date, causes, delta, scoreAfter, warning };
    })
    .filter(
      (e) =>
        e.delta !== 0 ||
        e.warning ||
        e.causes.some((c) => c.kind === 'eligibilityEnd') ||
        // Keep multi-cause months even when changes cancel (e.g., age-drop + work gain).
        e.causes.length > 1,
    );

  return { startScore, events, horizonEnd, endsAt45 };
}
