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

/** The points test only counts work in the 10 years before the reference date */
const WORK_WINDOW_MONTHS = 120;

/**
 * Whole years of a work period falling inside the 10-year window that ends at
 * `at`. An empty/invalid `end` means the job is ongoing.
 */
export function yearsInWindow(start: string, end: string, at: string): number {
  if (!isYm(start)) return 0;
  const a = toN(at);
  const e = isYm(end) ? Math.min(toN(end), a) : a;
  const months = Math.min(e, a) - Math.max(toN(start), a - WORK_WINDOW_MONTHS);
  return Math.floor(Math.max(0, months) / 12);
}

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
    if (isYm(j.ausWorkStart)) out.ausWork = ausWorkValue(yearsInWindow(j.ausWorkStart, j.ausWorkEnd, at));
    if (isYm(j.overseasWorkStart)) out.overseasWork = overseasWorkValue(yearsInWindow(j.overseasWorkStart, j.overseasWorkEnd, at));
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
  delta: number;                          // bare-score change this month (0 for pure warnings)
  scoreAfter: number;                     // bare score after this month
  /** Per-assessment base scores after this month (index-aligned with jobs) */
  basesAfter: number[];
  warning: boolean;                       // true when every cause is an expiry
}

export interface TimelineResult {
  startScore: number;
  /** Per-assessment base scores today (index-aligned with jobs) */
  startBases: number[];
  events: TimelineEvent[];
  horizonEnd: string;                     // YYYY-MM
  endsAt45: boolean;
}

// —— cause grouping (display helper) —————————————————————————————————————————

export interface GroupedCause {
  labelKey: string;
  params?: Record<string, string | number>;
  /** Tags of the assessments sharing this cause (empty for shared causes like age) */
  jobTags: string[];
}

/**
 * Merge identical causes across assessments so "Australian work reaches 3 yrs"
 * fired by A, B and C in the same month renders once with the tags collected.
 */
export function groupCauses(causes: TimelineCause[]): GroupedCause[] {
  const map = new Map<string, GroupedCause>();
  for (const c of causes) {
    const key = `${c.labelKey}|${JSON.stringify(c.params ?? {})}`;
    const g = map.get(key);
    if (g) {
      if (c.jobTag) g.jobTags.push(c.jobTag);
    } else {
      map.set(key, { labelKey: c.labelKey, params: c.params, jobTags: c.jobTag ? [c.jobTag] : [] });
    }
  }
  return [...map.values()];
}

// —— constants ———————————————————————————————————————————————————————————————

const HORIZON_MONTHS = 60;
/** Points-test English results must come from a test taken in the prior 3 years */
export const ENGLISH_VALIDITY_MONTHS = 36;

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

    // Work brackets can rise AND fall (ended periods slide out of the 10-year
    // window), so scan month by month for bracket transitions instead of
    // projecting fixed anniversaries. ≤60 iterations per field — cheap.
    const BRACKET_THRESHOLD: Record<string, number> = { '': 0, '1-3': 1, '3-5': 3, '5-8': 5, '8-10': 8 };
    const workSpecs = [
      { kind: 'ausWork' as const, start: j.ausWorkStart, end: j.ausWorkEnd, value: ausWorkValue, upKey: 'tl.ausWork', downKey: 'tl.ausWorkDrop' },
      { kind: 'overseasWork' as const, start: j.overseasWorkStart, end: j.overseasWorkEnd, value: overseasWorkValue, upKey: 'tl.overseasWork', downKey: 'tl.overseasWorkDrop' },
    ];
    for (const spec of workSpecs) {
      if (!isYm(spec.start)) continue;
      let prevVal = spec.value(yearsInWindow(spec.start, spec.end, today));
      const span = monthsBetween(today, horizonEnd);
      for (let m = 1; m <= span; m++) {
        const at = addMonths(today, m);
        const val = spec.value(yearsInWindow(spec.start, spec.end, at));
        if (val !== prevVal) {
          const rising = BRACKET_THRESHOLD[val] > BRACKET_THRESHOLD[prevVal];
          push(at, {
            kind: spec.kind,
            jobTag: tag,
            labelKey: rising ? spec.upKey : spec.downKey,
            // Rising: the threshold just reached; falling: the threshold just lost
            params: { years: rising ? BRACKET_THRESHOLD[val] : BRACKET_THRESHOLD[prevVal] },
          });
          prevVal = val;
        }
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

  // Per-assessment base scores (and the bare max) at an arbitrary month.
  const basesAt = (m: string): { bases: number[]; bare: number } => {
    const { shared: s, jobs: js } = applyDates(shared, jobs, dates, m);
    const ev = evaluate(s, js);
    return { bases: ev.jobs.map((je) => je.base), bare: ev.bareScore };
  };

  const start = basesAt(today);
  const startScore = start.bare;
  const startBases = start.bases;

  // Build events: sort ascending by month, compute per-assessment bases, then
  // keep months where ANY assessment's base moves (so every occupation's line
  // bends where it should), plus warnings and the eligibility end.
  let prevBare = startScore;
  let prevBases = startBases;
  const events: TimelineEvent[] = [];
  for (const [date, causes] of [...causesByMonth.entries()]
    .sort(([a], [b]) => monthsBetween(b, a))) { // ascending: monthsBetween(b, a) = toN(a) − toN(b)
    const { bases, bare } = basesAt(date);
    const delta = bare - prevBare;
    const anyBaseMoved = bases.some((b, i) => b !== prevBases[i]);
    const warning = causes.every((c) => WARNING_KINDS.has(c.kind));
    const keep = anyBaseMoved || warning
      || causes.some((c) => c.kind === 'eligibilityEnd')
      // Multi-cause months can cancel to zero on every base (age −5 + work +5)
      // yet still deserve a marker.
      || causes.length > 1;
    if (keep) {
      events.push({ date, causes, delta, scoreAfter: bare, basesAfter: bases, warning });
    }
    prevBare = bare;
    prevBases = bases;
  }

  return { startScore, startBases, events, horizonEnd, endsAt45 };
}
