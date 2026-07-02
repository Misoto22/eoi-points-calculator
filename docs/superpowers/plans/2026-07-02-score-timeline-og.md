# Score Timeline & Dynamic OG Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "04 · 分数推演 / TIMELINE" section that projects the bare score over the next 5 years from optional real dates (birth, work start, credential dates), and make shared links render a per-score Open Graph image.

**Architecture:** A pure engine (`src/lib/timeline.ts`) substitutes date-derived bracket values into the existing `evaluate()` — no parallel scoring logic. The chart is hand-written SVG in the site's editorial style (spec: direction A / variant V2). For OG, `src/app/page.tsx` becomes a thin server component whose `generateMetadata` parses the state from searchParams and points `og:image` at an edge `ImageResponse` route.

**Tech Stack:** Next.js 16 (app router, edge runtime, `next/og`), React 19, TypeScript, vitest. No chart library.

**Spec:** `docs/superpowers/specs/2026-07-02-timeline-og-design.md`. Read it before starting.

## Global Constraints

- All dates are `YYYY-MM` strings (month precision). Validate with a shared `isYm()`.
- Never hard-code point values — bracket deltas come from `sharedSelectCriteria` / `jobSelectCriteria` via `evaluate()`.
- All user-facing strings go through i18next; add every key to BOTH `public/locales/en/common.json` and `public/locales/zh/common.json`.
- Colors only via CSS variables (`var(--…)`) in components; OG route uses `cardPalettes.cream` (`bg #F2EFE5, ink #2B2A24, soft #4A473D, muted #8D8776, hair #CFC9B6`).
- Match existing code style: function components, inline style objects with tokens, English comments, files ≤ ~250 lines.
- Commit messages: conventional, ≤72 chars, imperative, with the repo's Co-Authored-By/Claude-Session trailers (see recent `git log`).
- **Deviation from spec (approved):** the OG image drops the `g=<goal>` param — the goal lives only in localStorage, never in the URL, so `generateMetadata` cannot know it. The OG card shows the score against the fixed 65 threshold.
- Occupation names on the OG image are English-only.
- Work-milestone logic assumes continuous full-time work from the start date; the 10-year look-back window is NOT modelled (UI note states this).
- After every task: `npm test` green, `npx tsc --noEmit` clean. `npx next build` where noted.

---

### Task 1: Assessing-authority data

**Files:**
- Create: `src/data/assessingAuthorities.ts`
- Test: `tests/assessingAuthorities.test.ts`

**Interfaces:**
- Consumes: `occupations` from `@/data/occupations` (array of `{ anzsco, en, zh, list }`).
- Produces: `interface AuthorityInfo { authority: string; validityYears: number | null }` and `function assessingAuthority(anzsco: string): AuthorityInfo`. `validityYears: null` means "does not expire". Task 3 and Task 4 rely on these exact names.

- [ ] **Step 1: Verify validity data against official sources**

Use WebSearch/WebFetch to confirm, and record each finding as a code comment with source URL in Step 3:
1. ACS skills assessment validity (expected: 2 years from issue — acs.org.au).
2. Migration-regulation default: skills assessment valid 3 years from issue unless the authority states a shorter period (homeaffairs.gov.au points table / Reg 2.26AC).
3. NAATI CCL credential expiry (expected: CCL does not expire → `validityYears: null`; certifications differ from credentials — naati.com.au).
4. English test validity for points: test taken in the 3 years before invitation (homeaffairs.gov.au).

If a finding contradicts the expected value, use the verified value and note it. Record the verification date in the file header comment.

- [ ] **Step 2: Write the failing test**

```ts
// tests/assessingAuthorities.test.ts
import { describe, expect, it } from 'vitest';
import { assessingAuthority } from '@/data/assessingAuthorities';
import { occupations } from '@/data/occupations';

describe('assessingAuthority', () => {
  it('maps ICT occupations to ACS with 2-year validity', () => {
    expect(assessingAuthority('261313')).toEqual({ authority: 'ACS', validityYears: 2 });
    expect(assessingAuthority('135112')).toEqual({ authority: 'ACS', validityYears: 2 });
    expect(assessingAuthority('313113')).toEqual({ authority: 'ACS', validityYears: 2 });
  });

  it('maps engineers to Engineers Australia', () => {
    expect(assessingAuthority('233211').authority).toBe('Engineers Australia');
    expect(assessingAuthority('233211').validityYears).toBe(3);
  });

  it('maps accountants, teachers and nurses to their bodies', () => {
    expect(assessingAuthority('221111').authority).toMatch(/CPA/);
    expect(assessingAuthority('241111').authority).toBe('AITSL');
    expect(assessingAuthority('254411').authority).toBe('ANMAC');
  });

  it('falls back to TRA for trades (major group 3) and VETASSESS otherwise', () => {
    expect(assessingAuthority('331111').authority).toBe('TRA');
    expect(assessingAuthority('224111').authority).toBe('VETASSESS');
  });

  it('resolves every occupation in the dataset', () => {
    for (const o of occupations) {
      const info = assessingAuthority(o.anzsco);
      expect(info.authority.length, o.anzsco).toBeGreaterThan(0);
      expect(info.validityYears === null || info.validityYears >= 1, o.anzsco).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/assessingAuthorities.test.ts`
Expected: FAIL — cannot resolve `@/data/assessingAuthorities`.

- [ ] **Step 4: Implement the data module**

```ts
// src/data/assessingAuthorities.ts
// Assessing authority + assessment validity per ANZSCO prefix.
// Verified YYYY-MM-DD against: <insert source URLs from Step 1>.
// Migration regs: assessments are valid 3 years from issue unless the
// authority specifies a shorter period (ACS: 2 years).

export interface AuthorityInfo {
  authority: string;
  /** Years the assessment stays valid; null = does not expire */
  validityYears: number | null;
}

// Longest-prefix match wins. Keep prefixes sorted roughly by specificity;
// the lookup sorts by length so order here is for readability only.
const PREFIX_RULES: Record<string, AuthorityInfo> = {
  '1351': { authority: 'ACS', validityYears: 2 },        // ICT managers
  '261': { authority: 'ACS', validityYears: 2 },          // ICT professionals
  '262': { authority: 'ACS', validityYears: 2 },
  '263': { authority: 'ACS', validityYears: 2 },
  '313': { authority: 'ACS', validityYears: 2 },          // ICT technicians
  '2211': { authority: 'CPAA / CAANZ / IPA', validityYears: 3 },
  '2212': { authority: 'CPAA / CAANZ / IPA', validityYears: 3 },
  '2213': { authority: 'CPAA / CAANZ / IPA', validityYears: 3 },
  '233': { authority: 'Engineers Australia', validityYears: 3 },
  '2339': { authority: 'Engineers Australia', validityYears: 3 },
  '241': { authority: 'AITSL', validityYears: 3 },        // school teachers
  '2542': { authority: 'ANMAC', validityYears: 3 },       // nurse managers
  '2544': { authority: 'ANMAC', validityYears: 3 },       // registered nurses
  '2545': { authority: 'ANMAC', validityYears: 3 },
  '2546': { authority: 'ANMAC', validityYears: 3 },
  '252': { authority: 'AHPRA / VETASSESS', validityYears: 3 },
  '253': { authority: 'Medical Board (AHPRA)', validityYears: 3 },
  '2711': { authority: 'SLAA (state legal bodies)', validityYears: 3 },
  '2723': { authority: 'APS', validityYears: 3 },         // psychologists
  '232111': { authority: 'AACA', validityYears: 3 },      // architects
};

const PREFIXES = Object.keys(PREFIX_RULES).sort((a, b) => b.length - a.length);

export function assessingAuthority(anzsco: string): AuthorityInfo {
  const hit = PREFIXES.find((p) => anzsco.startsWith(p));
  if (hit) return PREFIX_RULES[hit];
  // Trades (major group 3) default to TRA; professional/other to VETASSESS.
  return anzsco.startsWith('3')
    ? { authority: 'TRA', validityYears: 3 }
    : { authority: 'VETASSESS', validityYears: 3 };
}
```

Audit the mapping against `src/data/occupations.ts` unit groups (e.g. run `grep -o '"anzsco": "...."' | sort -u` equivalent or scan the file) and add any missing high-frequency groups (chefs 3513 → TRA, social workers 2725 → AASW, etc.) with verified values. Every added rule needs a source comment.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/assessingAuthorities.test.ts`
Expected: PASS (all 5).

- [ ] **Step 6: Commit**

```bash
git add src/data/assessingAuthorities.ts tests/assessingAuthorities.test.ts
git commit -m "feat: assessing-authority data with assessment validity"
```

---

### Task 2: Types, URL state and persistence for dates

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/urlState.ts`
- Test: `tests/urlState.test.ts` (extend existing)

**Interfaces:**
- Produces (Task 3/4/7 depend on these exact names):
  - `interface PlanningDates { birth: string; englishTest: string; naatiCert: string }` + `defaultPlanningDates` (types.ts)
  - `JobAssessment` gains required string fields `ausWorkStart`, `overseasWorkStart`, `assessmentDate` (default `''`, set in `newJob()`)
  - `AppState` becomes `{ shared, jobs, dates: PlanningDates }`
  - `parseStateFromParams(params: URLSearchParams): AppState | null` (server-safe; `readStateFromUrl()` becomes a window wrapper around it)
  - `stateToQueryString(shared, jobs, dates)` and `mergeQueryString(currentSearch, shared, jobs, dates)` — extra `dates` argument
  - `persistState(shared, jobs, dates)` writing dates under localStorage key `eoi-v2-dates`; `readInitialState()` returns `dates`
  - URL params: `b` (birth), `et` (englishTest), `nc` (naatiCert); `jobs=` segments 5–7 = `ausWorkStart:overseasWorkStart:assessmentDate`, trailing empty segments trimmed

- [ ] **Step 1: Write the failing tests**

Append to `tests/urlState.test.ts` (update the existing `job()`/`shared()` helpers to include the new fields with `''` defaults):

```ts
import { defaultPlanningDates } from '@/lib/types';
import type { PlanningDates } from '@/lib/types';

function dates(overrides: Partial<PlanningDates> = {}): PlanningDates {
  return { ...defaultPlanningDates, ...overrides };
}

describe('date serialisation', () => {
  it('round-trips shared dates via b/et/nc params', () => {
    const qs = stateToQueryString(shared({ age: '25-32' }), [job()], dates({ birth: '1995-03', englishTest: '2024-03' }));
    const params = new URLSearchParams(qs);
    expect(params.get('b')).toBe('1995-03');
    expect(params.get('et')).toBe('2024-03');
    expect(params.get('nc')).toBeNull();
    const state = parseStateFromParams(params);
    expect(state?.dates).toEqual(dates({ birth: '1995-03', englishTest: '2024-03' }));
  });

  it('appends job dates as segments 5-7 and trims trailing empties', () => {
    const j = job({ anzsco: '261313', ausWorkStart: '2026-06', overseasWorkStart: '2021-11' });
    const qs = stateToQueryString(shared(), [j], dates());
    expect(new URLSearchParams(qs).get('jobs')).toBe('261313:::0:2026-06:2021-11');
  });

  it('parses old-format jobs params without date segments', () => {
    const state = parseStateFromParams(new URLSearchParams('jobs=261313:3-5::1'));
    expect(state?.jobs[0].anzsco).toBe('261313');
    expect(state?.jobs[0].ausWorkStart).toBe('');
    expect(state?.jobs[0].assessmentDate).toBe('');
  });

  it('rejects malformed date params instead of storing them', () => {
    const state = parseStateFromParams(new URLSearchParams('b=hello&a=25-32'));
    expect(state?.dates.birth).toBe('');
  });

  it('mergeQueryString keeps foreign params alongside dates', () => {
    const qs = mergeQueryString('?lng=zh', shared(), [job()], dates({ birth: '1995-03' }));
    const params = new URLSearchParams(qs);
    expect(params.get('lng')).toBe('zh');
    expect(params.get('b')).toBe('1995-03');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/urlState.test.ts`
Expected: FAIL — `defaultPlanningDates` / `parseStateFromParams` not exported; `stateToQueryString` arity.

- [ ] **Step 3: Implement types.ts changes**

```ts
// add to src/lib/types.ts
/** Optional month-precision dates powering the score timeline (all YYYY-MM or '') */
export interface PlanningDates {
  birth: string;
  englishTest: string;
  naatiCert: string;
}

export const defaultPlanningDates: PlanningDates = { birth: '', englishTest: '', naatiCert: '' };

/** Month-string guard shared by url parsing, timeline math and inputs */
export function isYm(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}
```

Extend `JobAssessment` with `ausWorkStart: string; overseasWorkStart: string; assessmentDate: string;` and add the three `''` fields to `newJob()`.

- [ ] **Step 4: Implement urlState.ts changes**

Key edits (keep everything else intact):

```ts
import { defaultPlanningDates, defaultSharedCriteria, isYm, newJob } from './types';
import type { JobAssessment, PlanningDates, SharedCriteria } from './types';

const DATE_PARAMS: Record<string, keyof PlanningDates> = { b: 'birth', et: 'englishTest', nc: 'naatiCert' };
const V2_DATES_KEY = 'eoi-v2-dates';

export interface AppState {
  shared: SharedCriteria;
  jobs: JobAssessment[];
  dates: PlanningDates;
}

/** Server-safe parser: the whole read path without touching window */
export function parseStateFromParams(params: URLSearchParams): AppState | null {
  if (params.size === 0) return null;
  const shared = { ...defaultSharedCriteria };
  const dates = { ...defaultPlanningDates };
  let hasAny = false;
  // …existing SHARED_PARAMS / FLAG_PARAMS loops unchanged…
  for (const [param, field] of Object.entries(DATE_PARAMS)) {
    const v = params.get(param);
    if (v && isYm(v)) { dates[field] = v; hasAny = true; }
  }
  let jobs: JobAssessment[] = [];
  const js = params.get('jobs');
  if (js) {
    jobs = js.split('|').slice(0, MAX_JOBS).map((part) => {
      const seg = part.split(':');
      const job = newJob();
      job.anzsco = seg[0] || '';
      job.ausWork = seg[1] || '';
      job.overseasWork = seg[2] || '';
      job.professionalYear = seg[3] === '1';
      job.ausWorkStart = seg[4] && isYm(seg[4]) ? seg[4] : '';
      job.overseasWorkStart = seg[5] && isYm(seg[5]) ? seg[5] : '';
      job.assessmentDate = seg[6] && isYm(seg[6]) ? seg[6] : '';
      return job;
    });
    if (jobs.length) hasAny = true;
  }
  if (!hasAny) return null;
  return { shared, jobs: jobs.length ? jobs : [newJob()], dates };
}

export function readStateFromUrl(): AppState | null {
  if (typeof window === 'undefined') return null;
  return parseStateFromParams(new URLSearchParams(window.location.search));
}
```

Serialization: in `stateToQueryString(shared, jobs, dates)` job mapping becomes

```ts
.map((j) => [j.anzsco, j.ausWork, j.overseasWork, j.professionalYear ? '1' : '0',
             j.ausWorkStart, j.overseasWorkStart, j.assessmentDate]
  .join(':').replace(/:+$/, ''))
```

and after the flag loop add:

```ts
for (const [param, field] of Object.entries(DATE_PARAMS)) {
  if (dates[field]) params.set(param, dates[field]);
}
```

Also: add `'b', 'et', 'nc'` to `STATE_PARAM_KEYS`; thread `dates` through `mergeQueryString` and `persistState` (write `V2_DATES_KEY`); in `readInitialState()` read `V2_DATES_KEY` (spread onto `defaultPlanningDates`, drop non-`isYm` values) and include `dates` in every return path (URL path returns parsed dates; v1-migration and default paths return `{ ...defaultPlanningDates }`). Update the jobs filter so a job with only dates still serializes: add `|| j.ausWorkStart || j.overseasWorkStart || j.assessmentDate` to the `.filter(…)`.

- [ ] **Step 5: Run tests, fix compile errors in callers**

Run: `npm test` and `npx tsc --noEmit`
`src/app/page.tsx` still calls the old signatures — update the calls minimally (pass `initial.dates` into a `useState` you'll wire properly in Task 4; pass `dates` to `persistState`/`mergeQueryString` in the effect and add it to the deps array).
Expected: all tests PASS, tsc clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/urlState.ts tests/urlState.test.ts src/app/page.tsx
git commit -m "feat: month-precision planning dates in state, URL and storage"
```

---

### Task 3: Timeline engine

**Files:**
- Create: `src/lib/timeline.ts`
- Test: `tests/timeline.test.ts`

**Interfaces:**
- Consumes: `evaluate` (`@/lib/points`), criteria tables (`@/data/pointsCriteria`), `assessingAuthority` (Task 1), `PlanningDates`/`isYm` (Task 2).
- Produces (Task 4/6 depend on these exact names):

```ts
export interface TimelineCause {
  kind: 'age' | 'ausWork' | 'overseasWork' | 'englishExpiry'
      | 'assessmentExpiry' | 'eligibilityEnd';
  jobTag?: string;                 // 'A' | 'B' | … for per-assessment causes
  labelKey: string;                // i18n key under tl.*
  params?: Record<string, string | number>;
}
export interface TimelineEvent {
  date: string;                    // YYYY-MM
  causes: TimelineCause[];
  delta: number;                   // score change this month (0 for pure warnings)
  scoreAfter: number;              // bare score after this month
  warning: boolean;                // true when every cause is an expiry
}
export interface TimelineResult {
  startScore: number;
  events: TimelineEvent[];
  horizonEnd: string;              // YYYY-MM
  endsAt45: boolean;
}
export function addMonths(ym: string, n: number): string
export function monthsBetween(a: string, b: string): number   // b − a
export function applyDates(shared: SharedCriteria, jobs: JobAssessment[], dates: PlanningDates, at: string): { shared: SharedCriteria; jobs: JobAssessment[] }
export function buildTimeline(input: { shared: SharedCriteria; jobs: JobAssessment[]; dates: PlanningDates; today: string }): TimelineResult
```

- [ ] **Step 1: Write the failing tests**

```ts
// tests/timeline.test.ts
import { describe, expect, it } from 'vitest';
import { addMonths, applyDates, buildTimeline, monthsBetween } from '@/lib/timeline';
import { defaultPlanningDates, defaultSharedCriteria, newJob } from '@/lib/types';

const shared = (o = {}) => ({ ...defaultSharedCriteria, age: '25-32', english: 'ielts8', education: 'bachelor', partnerStatus: 'single', ...o });
const dates = (o = {}) => ({ ...defaultPlanningDates, ...o });
const job = (o = {}) => ({ ...newJob(), anzsco: '261313', ...o });

describe('month math', () => {
  it('adds across year boundaries', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -2)).toBe('2025-11');
  });
  it('measures signed distance', () => {
    expect(monthsBetween('2026-07', '2027-01')).toBe(6);
    expect(monthsBetween('2027-01', '2026-07')).toBe(-6);
  });
});

describe('applyDates', () => {
  it('derives the age bracket from birth as of a date', () => {
    // Born 1995-03: turns 33 in 2028-03
    expect(applyDates(shared(), [], dates({ birth: '1995-03' }), '2028-02').shared.age).toBe('25-32');
    expect(applyDates(shared(), [], dates({ birth: '1995-03' }), '2028-03').shared.age).toBe('33-39');
  });
  it('derives work brackets, treating future starts as zero years', () => {
    const j = job({ ausWorkStart: '2026-06' });
    expect(applyDates(shared(), [j], dates(), '2027-06').jobs[0].ausWork).toBe('1-3');
    expect(applyDates(shared(), [j], dates(), '2026-01').jobs[0].ausWork).toBe('');
  });
  it('leaves manual brackets alone when no date is set', () => {
    const j = job({ ausWork: '3-5' });
    expect(applyDates(shared(), [j], dates(), '2030-01').jobs[0].ausWork).toBe('3-5');
  });
});

describe('buildTimeline', () => {
  const today = '2026-07';

  it('returns no events without any dates', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job()], dates: dates(), today });
    expect(r.events).toEqual([]);
  });

  it('emits an age-drop event with criteria-derived delta', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job()], dates: dates({ birth: '1995-03' }), today });
    const drop = r.events.find((e) => e.causes.some((c) => c.kind === 'age'));
    expect(drop?.date).toBe('2028-03');
    expect(drop?.delta).toBe(-5); // 30 → 25 from sharedSelectCriteria
  });

  it('emits work milestones per assessment', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job({ overseasWorkStart: '2021-11' })], dates: dates(), today });
    const m = r.events.find((e) => e.causes.some((c) => c.kind === 'overseasWork'));
    expect(m?.date).toBe('2026-11'); // 5 years from 2021-11
    expect(m?.delta).toBe(5);        // 3-5 (5) → 5-8 (10)
  });

  it('emits expiry warnings with zero delta', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job({ assessmentDate: '2025-09' })], dates: dates({ englishTest: '2024-06' }), today });
    const eng = r.events.find((e) => e.causes.some((c) => c.kind === 'englishExpiry'));
    expect(eng?.date).toBe('2027-06');
    expect(eng?.delta).toBe(0);
    expect(eng?.warning).toBe(true);
    const acs = r.events.find((e) => e.causes.some((c) => c.kind === 'assessmentExpiry'));
    expect(acs?.date).toBe('2027-09'); // ACS = 2 years
  });

  it('merges same-month causes into one event', () => {
    // 33rd birthday and a work milestone in the same month
    const r = buildTimeline({
      shared: shared(), jobs: [job({ ausWorkStart: '2025-03' })],
      dates: dates({ birth: '1995-03' }), today,
    });
    const e = r.events.find((ev) => ev.date === '2028-03');
    expect(e?.causes.length).toBe(2);   // age −5, aus 1→3 yrs +5
    expect(e?.delta).toBe(0);           // net
  });

  it('caps the horizon at the 45th birthday and flags it', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job()], dates: dates({ birth: '1983-01' }), today });
    expect(r.horizonEnd).toBe('2028-01');
    expect(r.endsAt45).toBe(true);
    expect(r.events.at(-1)?.causes[0].kind).toBe('eligibilityEnd');
  });

  it('uses the max base across assessments for scoreAfter', () => {
    const strong = job({ ausWork: '8-10' });
    const weak = job({ anzsco: '233211', ausWorkStart: '2026-01' });
    const r = buildTimeline({ shared: shared(), jobs: [strong, weak], dates: dates(), today });
    // weak job's milestone (+5 on its own card) doesn't beat strong job's base → no event
    expect(r.events.filter((e) => e.delta !== 0)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/timeline.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/timeline.ts`**

```ts
import { evaluate } from './points';
import { isYm } from './types';
import type { JobAssessment, PlanningDates, SharedCriteria } from './types';
import { assessingAuthority } from '@/data/assessingAuthorities';

// —— month math ——————————————————————————————————————————————
const toN = (ym: string): number => {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
};
const fromN = (n: number): string =>
  `${String(Math.floor(n / 12)).padStart(4, '0')}-${String((n % 12) + 1).padStart(2, '0')}`;

export const addMonths = (ym: string, n: number): string => fromN(toN(ym) + n);
export const monthsBetween = (a: string, b: string): number => toN(b) - toN(a);

const fullYears = (from: string, at: string): number =>
  Math.floor(Math.max(0, monthsBetween(from, at)) / 12);

// —— bracket derivation ————————————————————————————————————————
const AGE_BRACKETS: [min: number, max: number, value: string][] = [
  [18, 24, '18-24'], [25, 32, '25-32'], [33, 39, '33-39'], [40, 44, '40-44'],
];
const ageValue = (years: number): string =>
  AGE_BRACKETS.find(([min, max]) => years >= min && years <= max)?.[2] ?? '';

const ausWorkValue = (y: number): string =>
  y >= 8 ? '8-10' : y >= 5 ? '5-8' : y >= 3 ? '3-5' : y >= 1 ? '1-3' : '';
const overseasWorkValue = (y: number): string =>
  y >= 8 ? '8-10' : y >= 5 ? '5-8' : y >= 3 ? '3-5' : '';

/** Substitute date-derived bracket values as of `at`; manual values stay untouched. */
export function applyDates(
  shared: SharedCriteria, jobs: JobAssessment[], dates: PlanningDates, at: string,
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

// —— timeline ———————————————————————————————————————————————
export interface TimelineCause {
  kind: 'age' | 'ausWork' | 'overseasWork' | 'englishExpiry' | 'assessmentExpiry' | 'eligibilityEnd';
  jobTag?: string;
  labelKey: string;
  params?: Record<string, string | number>;
}
export interface TimelineEvent {
  date: string;
  causes: TimelineCause[];
  delta: number;
  scoreAfter: number;
  warning: boolean;
}
export interface TimelineResult {
  startScore: number;
  events: TimelineEvent[];
  horizonEnd: string;
  endsAt45: boolean;
}

const HORIZON_MONTHS = 60;
const ENGLISH_VALIDITY_MONTHS = 36;
const WARNING_KINDS = new Set(['englishExpiry', 'assessmentExpiry']);

export function buildTimeline({ shared, jobs, dates, today }: {
  shared: SharedCriteria; jobs: JobAssessment[]; dates: PlanningDates; today: string;
}): TimelineResult {
  const birth45 = isYm(dates.birth) ? addMonths(dates.birth, 45 * 12) : null;
  const capped = addMonths(today, HORIZON_MONTHS);
  const endsAt45 = birth45 !== null && monthsBetween(birth45, capped) >= 0;
  const horizonEnd = endsAt45 ? birth45! : capped;

  const inWindow = (m: string) => monthsBetween(today, m) > 0 && monthsBetween(m, horizonEnd) >= 0;
  const causesByMonth = new Map<string, TimelineCause[]>();
  const push = (m: string, c: TimelineCause) => {
    if (!inWindow(m)) return;
    causesByMonth.set(m, [...(causesByMonth.get(m) ?? []), c]);
  };

  if (isYm(dates.birth)) {
    for (const target of [33, 40] as const) {
      push(addMonths(dates.birth, target * 12), { kind: 'age', labelKey: `tl.age${target}`, params: { age: target } });
    }
    if (endsAt45) push(birth45!, { kind: 'eligibilityEnd', labelKey: 'tl.age45', params: { age: 45 } });
  }
  jobs.forEach((j, i) => {
    const tag = String.fromCharCode(65 + i);
    if (isYm(j.ausWorkStart)) for (const y of [1, 3, 5, 8]) {
      push(addMonths(j.ausWorkStart, y * 12), { kind: 'ausWork', jobTag: tag, labelKey: 'tl.ausWork', params: { years: y } });
    }
    if (isYm(j.overseasWorkStart)) for (const y of [3, 5, 8]) {
      push(addMonths(j.overseasWorkStart, y * 12), { kind: 'overseasWork', jobTag: tag, labelKey: 'tl.overseasWork', params: { years: y } });
    }
    if (isYm(j.assessmentDate)) {
      const info = assessingAuthority(j.anzsco);
      if (info.validityYears !== null) {
        push(addMonths(j.assessmentDate, info.validityYears * 12), {
          kind: 'assessmentExpiry', jobTag: tag, labelKey: 'tl.assessmentExpiry',
          params: { authority: info.authority },
        });
      }
    }
  });
  if (isYm(dates.englishTest)) {
    push(addMonths(dates.englishTest, ENGLISH_VALIDITY_MONTHS), { kind: 'englishExpiry', labelKey: 'tl.englishExpiry' });
  }
  // NAATI CCL: verified as non-expiring (Task 1) — no event. If Task 1 found an
  // expiry, add the same push pattern here with a 'naatiExpiry' kind.

  const scoreAt = (m: string): number => {
    const { shared: s, jobs: js } = applyDates(shared, jobs, dates, m);
    return evaluate(s, js).bareScore;
  };
  const startScore = scoreAt(today);

  let prev = startScore;
  const events: TimelineEvent[] = [...causesByMonth.entries()]
    .sort(([a], [b]) => monthsBetween(b, a))     // ascending by month
    .map(([date, causes]) => {
      const scoreAfter = scoreAt(date);
      const delta = scoreAfter - prev;
      prev = scoreAfter;
      const warning = causes.every((c) => WARNING_KINDS.has(c.kind));
      return { date, causes, delta, scoreAfter, warning };
    })
    // keep months that changed the score, carry a warning, or end eligibility
    .filter((e) => e.delta !== 0 || e.warning || e.causes.some((c) => c.kind === 'eligibilityEnd'));

  return { startScore, events, horizonEnd, endsAt45 };
}
```

Note the sort comparator: `monthsBetween(b, a)` ascending — verify against the tests; if ordering is inverted the age test dates will catch it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/timeline.test.ts`
Expected: PASS (all). Also run `npm test` (whole suite) and `npx tsc --noEmit`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/timeline.ts tests/timeline.test.ts
git commit -m "feat: timeline engine projecting bare score from dates"
```

---

### Task 4: Date inputs — MonthField, TimelineSection panel, page wiring, i18n

**Files:**
- Create: `src/components/MonthField.tsx`
- Create: `src/components/TimelineSection.tsx` (panel + empty state; chart lands in Task 6)
- Modify: `src/app/page.tsx` (dates state, section insert, renumber)
- Modify: `src/components/ReferenceSection.tsx` (num 04 → 05)
- Modify: `public/locales/en/common.json`, `public/locales/zh/common.json`

**Interfaces:**
- Consumes: `PlanningDates`, `patchJob` pattern from page, `buildTimeline`/`applyDates` (Task 3), `assessingAuthority` (Task 1).
- Produces: `TimelineSection` props consumed in Task 6:

```ts
interface TimelineSectionProps {
  dates: PlanningDates;
  onDatesPatch: (patch: Partial<PlanningDates>) => void;
  jobs: JobAssessment[];
  onJobPatch: (id: string, patch: Partial<JobAssessment>) => void;
  naatiChecked: boolean;
  timeline: TimelineResult;
  goal: number;
  today: string;
}
```

- [ ] **Step 1: Add i18n strings**

`public/locales/en/common.json` — add:

```json
"sections": { "…existing…": "", "timeline": "Score timeline" },
"tlNote": "Optional: enter real months to project your score over the next 5 years — age-bracket drops, work milestones and credential expiries. Assumes continuous full-time work from each start month.",
"tlBirth": "Birth month",
"tlEnglishTest": "English test month",
"tlNaatiCert": "NAATI CCL credential month",
"tlNaatiHint": "Enabled with the NAATI bonus above",
"tlNaatiNoExpiry": "CCL credentials do not expire",
"tlAusStart": "Australian work start",
"tlOvsStart": "Overseas work start",
"tlAssessDate": "Assessment issue month",
"tlDerived": "Derived from date",
"tlExpiresOn": "{{authority}} · valid {{years}} yrs · expires {{date}}",
"tlEnglishExpires": "Expires {{date}} (valid 3 years)",
"tlInvalidDate": "Enter a month like 2026-07",
"tlFutureBirth": "Birth month must be in the past",
"tlUnder18": "Under 18 — age points require 18+",
"tlOver45": "Age 45+ — no longer eligible for these visas",
"tlEmpty": "Fill in any month above to draw the projection.",
"tl": {
  "age33": "Turns 33 — age bracket drops",
  "age40": "Turns 40 — age bracket drops",
  "age45": "Turns 45 — no longer eligible",
  "ausWork": "Australian work reaches {{years}} yrs",
  "overseasWork": "Overseas work reaches {{years}} yrs",
  "englishExpiry": "English test result expires",
  "assessmentExpiry": "{{authority}} assessment expires"
},
"tlToday": "TODAY",
"tlGoalLine": "Goal {{n}}",
"tlMinLine": "Minimum {{n}}",
"tlChartSummary": "Projected score timeline from {{from}} to {{to}}, starting at {{score}} points with {{n}} events."
```

`public/locales/zh/common.json` — same keys:

```json
"sections": { "…existing…": "", "timeline": "分数推演" },
"tlNote": "选填:输入具体年月,推演未来 5 年的分数变化——年龄跨档、工龄里程碑与证件时效。假设自起始月起连续全职工作。",
"tlBirth": "出生年月",
"tlEnglishTest": "英语考试年月",
"tlNaatiCert": "NAATI CCL 认证年月",
"tlNaatiHint": "勾选上方 NAATI 加分后启用",
"tlNaatiNoExpiry": "CCL 认证长期有效",
"tlAusStart": "澳洲工作起始",
"tlOvsStart": "海外工作起始",
"tlAssessDate": "职业评估获得月",
"tlDerived": "已由日期推导",
"tlExpiresOn": "{{authority}} · 有效期 {{years}} 年 · {{date}} 到期",
"tlEnglishExpires": "{{date}} 到期(有效期 3 年)",
"tlInvalidDate": "请输入形如 2026-07 的年月",
"tlFutureBirth": "出生年月须早于今天",
"tlUnder18": "未满 18 岁——年龄加分要求 18 岁以上",
"tlOver45": "已满 45 岁——不再符合这些签证的申请条件",
"tlEmpty": "在上方填入任意年月即可生成推演图。",
"tl": {
  "age33": "满 33 岁,年龄档下调",
  "age40": "满 40 岁,年龄档下调",
  "age45": "满 45 岁,失去申请资格",
  "ausWork": "澳洲工龄满 {{years}} 年",
  "overseasWork": "海外工龄满 {{years}} 年",
  "englishExpiry": "英语成绩到期",
  "assessmentExpiry": "{{authority}} 职业评估到期"
},
"tlToday": "今天",
"tlGoalLine": "目标 {{n}}",
"tlMinLine": "最低 {{n}}",
"tlChartSummary": "{{from}} 至 {{to}} 的分数推演,起始 {{score}} 分,共 {{n}} 个事件。"
```

(Fold each key into the existing JSON structure — `sections` already exists; add `timeline` inside it, the rest at top level.)

- [ ] **Step 2: Implement MonthField**

```tsx
// src/components/MonthField.tsx
'use client';

import { useId } from 'react';

interface MonthFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Muted helper line under the field */
  note?: string;
  /** Danger-colored helper line (takes precedence over note) */
  warnNote?: string;
  disabled?: boolean;
}

/** Month-precision date input styled like the existing form fields */
export default function MonthField({ label, value, onChange, note, warnNote, disabled }: MonthFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[11.5px] tracking-[0.16em] font-medium mb-2.5" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        id={id}
        type="month"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full box-border px-3.5 py-[11px] text-[13.5px] tabular-nums outline-none focus:border-[var(--muted)] disabled:opacity-45"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--hair)',
          color: 'var(--ink)',
          fontFamily: 'inherit',
          colorScheme: 'light dark',
          transition: 'border-color 0.2s ease',
        }}
      />
      {(warnNote || note) && (
        <p className="m-0 mt-1.5 text-[11px] leading-[1.5]" style={{ color: warnNote ? 'var(--danger)' : 'var(--muted)' }}>
          {warnNote || note}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement TimelineSection (panel + empty state)**

```tsx
// src/components/TimelineSection.tsx
'use client';

import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import MonthField from './MonthField';
import { addMonths, monthsBetween } from '@/lib/timeline';
import type { TimelineResult } from '@/lib/timeline';
import type { JobAssessment, PlanningDates } from '@/lib/types';
import { isYm } from '@/lib/types';
import { assessingAuthority } from '@/data/assessingAuthorities';

interface TimelineSectionProps {
  dates: PlanningDates;
  onDatesPatch: (patch: Partial<PlanningDates>) => void;
  jobs: JobAssessment[];
  onJobPatch: (id: string, patch: Partial<JobAssessment>) => void;
  naatiChecked: boolean;
  timeline: TimelineResult;
  goal: number;
  today: string;
}

export default function TimelineSection({
  dates, onDatesPatch, jobs, onJobPatch, naatiChecked, timeline, goal, today,
}: TimelineSectionProps) {
  const { t } = useTranslation();

  const hasAnyDate = isYm(dates.birth) || isYm(dates.englishTest)
    || jobs.some((j) => isYm(j.ausWorkStart) || isYm(j.overseasWorkStart) || isYm(j.assessmentDate));

  // Future birth or an implied age under 18 both invalidate the derivation
  const birthWarn = isYm(dates.birth)
    ? (dates.birth >= today ? t('tlFutureBirth')
      : monthsBetween(dates.birth, today) < 18 * 12 ? t('tlUnder18') : undefined)
    : undefined;
  const englishNote = isYm(dates.englishTest)
    ? t('tlEnglishExpires', { date: addMonths(dates.englishTest, 36) })
    : undefined;

  return (
    <section className="mt-[72px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.28s backwards' }}>
      <SectionHeading num="04" title={t('sections.timeline')} side="TIMELINE" />
      <p className="mt-3.5 mb-0 text-[12.5px] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
        {t('tlNote')}
      </p>

      <div className="grid gap-x-9 gap-y-[22px] mt-[26px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
        <MonthField label={t('tlBirth')} value={dates.birth} onChange={(v) => onDatesPatch({ birth: v })} warnNote={birthWarn} />
        <MonthField label={t('tlEnglishTest')} value={dates.englishTest} onChange={(v) => onDatesPatch({ englishTest: v })} warnNote={englishNote} />
        <MonthField
          label={t('tlNaatiCert')}
          value={dates.naatiCert}
          onChange={(v) => onDatesPatch({ naatiCert: v })}
          disabled={!naatiChecked}
          note={naatiChecked ? t('tlNaatiNoExpiry') : t('tlNaatiHint')}
        />
      </div>

      {jobs.map((j, i) => {
        const info = assessingAuthority(j.anzsco);
        const assessNote = isYm(j.assessmentDate) && info.validityYears !== null
          ? t('tlExpiresOn', { authority: info.authority, years: info.validityYears, date: addMonths(j.assessmentDate, info.validityYears * 12) })
          : j.anzsco ? info.authority : undefined;
        return (
          <div
            key={j.id}
            className="grid gap-x-9 gap-y-[18px] items-end mt-[18px] pt-3.5"
            style={{ gridTemplateColumns: '26px repeat(auto-fill, minmax(min(200px, 100%), 1fr))', borderTop: '1px solid var(--hair-soft)' }}
          >
            <span className="text-[17px] pb-[11px]" style={{ fontFamily: 'var(--font-serif)' }}>
              {String.fromCharCode(65 + i)}
            </span>
            <MonthField label={t('tlAusStart')} value={j.ausWorkStart} onChange={(v) => onJobPatch(j.id, { ausWorkStart: v })} />
            <MonthField label={t('tlOvsStart')} value={j.overseasWorkStart} onChange={(v) => onJobPatch(j.id, { overseasWorkStart: v })} />
            <MonthField label={t('tlAssessDate')} value={j.assessmentDate} onChange={(v) => onJobPatch(j.id, { assessmentDate: v })} warnNote={undefined} note={assessNote} />
          </div>
        );
      })}

      {!hasAnyDate && (
        <p className="mt-[26px] mb-0 text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('tlEmpty')}</p>
      )}
      {/* TimelineChart mounts here in Task 6 */}
    </section>
  );
}
```

- [ ] **Step 4: Wire the page**

In `src/app/page.tsx` (PageContent):

```tsx
import TimelineSection from '@/components/TimelineSection';
import { applyDates, buildTimeline } from '@/lib/timeline';
import type { PlanningDates } from '@/lib/types';

// state (initial.dates comes from Task 2's readInitialState)
const [dates, setDates] = useState<PlanningDates>(initial.dates);
const patchDates = useCallback((patch: Partial<PlanningDates>) => {
  setDates((prev) => ({ ...prev, ...patch }));
}, []);

// today as YYYY-MM — PageContent only renders after the mounted gate, so this is client-safe
const today = useMemo(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}, []);

// evaluation now uses date-derived brackets
const derived = useMemo(() => applyDates(shared, jobs, dates, today), [shared, jobs, dates, today]);
const evaluation = useMemo(() => evaluate(derived.shared, derived.jobs), [derived]);
const timeline = useMemo(() => buildTimeline({ shared, jobs, dates, today }), [shared, jobs, dates, today]);
```

Extend the persist effect deps to `[shared, jobs, dates]` and pass `dates` to `persistState`/`mergeQueryString` (partially done in Task 2). Extend `handleReset` to `setDates({ ...defaultPlanningDates })`. Insert between `<ResultsBand …/>` and `<ReferenceSection …/>`:

```tsx
<TimelineSection
  dates={dates}
  onDatesPatch={patchDates}
  jobs={jobs}
  onJobPatch={patchJob}
  naatiChecked={shared.communityLanguage}
  timeline={timeline}
  goal={goalPoints}
  today={today}
/>
```

In `src/components/ReferenceSection.tsx` change `<SectionHeading num="04"` to `num="05"`.

- [ ] **Step 5: Verify**

Run: `npm test && npx tsc --noEmit && npx next build`
Expected: green/clean/compiles.
Then `npm run dev`, open http://localhost:3000 with Playwright: fill 出生年月 1995-03 → the section shows, `?b=1995-03` lands in the URL after ~300ms, reload restores it, reset clears it. Check both languages and both themes.

- [ ] **Step 6: Commit**

```bash
git add src/components/MonthField.tsx src/components/TimelineSection.tsx src/app/page.tsx src/components/ReferenceSection.tsx public/locales/en/common.json public/locales/zh/common.json
git commit -m "feat: timeline section with month-date inputs"
```

---

### Task 5: Derivation locking of bracket selects

**Files:**
- Modify: `src/components/SelectField.tsx`
- Modify: `src/components/SharedCriteriaSection.tsx`
- Modify: `src/components/JobCard.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `derived` state from Task 4 (`applyDates` output already drives `evaluate`).
- Produces: `SelectField` gains optional `lockedNote?: string` — when set the trigger is disabled and the note renders under the field. `SharedCriteriaSection` gains `derivedAge?: string | null`; `JobCard`'s `job` prop now receives the DERIVED job for display.

- [ ] **Step 1: Add `lockedNote` to SelectField**

In `SelectFieldProps` add `lockedNote?: string`. On the trigger button:

```tsx
disabled={!!lockedNote}
aria-disabled={!!lockedNote}
className="… disabled:cursor-default"
```

Guard `onClick`/`onKeyDown` with `if (lockedNote) return;`. Hide the chevron when locked (`{!lockedNote && <svg …/>}`) and after the button render:

```tsx
{lockedNote && (
  <p className="m-0 mt-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>{lockedNote}</p>
)}
```

- [ ] **Step 2: Pass derived values + lock notes down**

`page.tsx`: `SharedCriteriaSection` gets `shared={derived.shared}` for display and a new prop `ageLocked={isYm(dates.birth)}`; JobCard rows get `job={derived.jobs[i]}` for display while patches still go to the raw `jobs` via id (ids are preserved by `applyDates`). Pass `ausWorkLocked={isYm(jobs[i].ausWorkStart)}` / `overseasWorkLocked={isYm(jobs[i].overseasWorkStart)}` — note: check the RAW job for date presence.

`SharedCriteriaSection`: for the `age` field only, `lockedNote={ageLocked ? t('tlDerived') : undefined}`.
`JobCard`: for `ausWork`/`overseasWork` selects, `lockedNote={locked ? t('tlDerived') : undefined}` respectively (add the two boolean props to `JobCardProps`).

- [ ] **Step 3: Verify**

Run: `npm test && npx tsc --noEmit`, then in the dev browser: set 出生年月 → age select shows the derived bracket, is not clickable, shows 已由日期推导; clear the date → unlocked. Same for work dates on card A. The headline score must match the derived selection.

- [ ] **Step 4: Commit**

```bash
git add src/components/SelectField.tsx src/components/SharedCriteriaSection.tsx src/components/JobCard.tsx src/app/page.tsx
git commit -m "feat: lock bracket selects to date-derived values"
```

---

### Task 6: Timeline chart (SVG)

**Files:**
- Create: `src/components/TimelineChart.tsx`
- Modify: `src/components/TimelineSection.tsx` (mount chart + sr-only event list)

**Interfaces:**
- Consumes: `TimelineResult`, `TimelineEvent` (Task 3), i18n keys `tl.*`, `tlToday`, `tlGoalLine`, `tlMinLine`, `tlChartSummary` (Task 4).
- Produces: `<TimelineChart timeline={TimelineResult} goal={number} today={string} />`.

- [ ] **Step 1: Implement the chart**

Spec visual = direction A variant V2 (see mockups in `.superpowers/brainstorm/6616-1782974454/content/`): step line 1.75px ink, 6%-opacity ink area fill, goal band above the dashed goal line, dashed 65 line, filled ink dots for gains, danger-outlined dots for losses, red dashed flag + rotated square for warnings, date+short-label pairs under the axis on two alternating rows, year ticks, today hairline with start score, × marker when `endsAt45`.

```tsx
// src/components/TimelineChart.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { monthsBetween } from '@/lib/timeline';
import type { TimelineResult } from '@/lib/timeline';
import { MIN_POINTS } from '@/data/pointsCriteria';

interface TimelineChartProps {
  timeline: TimelineResult;
  goal: number;
  today: string;
}

const W = 720, H = 268, PL = 40, PR = 30, TOP = 30, AXIS = 176;

export default function TimelineChart({ timeline, goal, today }: TimelineChartProps) {
  const { t } = useTranslation();
  const { startScore, events, horizonEnd, endsAt45 } = timeline;

  const total = Math.max(1, monthsBetween(today, horizonEnd));
  const x = (ym: string) => PL + (monthsBetween(today, ym) / total) * (W - PL - PR);

  const scores = [startScore, ...events.map((e) => e.scoreAfter)];
  const yMin = Math.min(MIN_POINTS, ...scores) - 8;
  const yMax = Math.max(goal, ...scores) + 8;
  const y = (s: number) => AXIS - ((s - yMin) / (yMax - yMin)) * (AXIS - TOP);

  // step path: horizontal to each score event, vertical at the event month
  let d = `M${PL} ${y(startScore)}`;
  let lastY = y(startScore);
  for (const e of events) {
    if (e.delta === 0) continue;
    d += ` H${x(e.date)} V${y(e.scoreAfter)}`;
    lastY = y(e.scoreAfter);
  }
  const endX = x(horizonEnd);
  d += ` H${endX}`;
  const area = `${d} V${AXIS} H${PL} Z`;

  // label collision: alternate rows when neighbours are closer than 72px
  const labelled = events.map((e) => ({ e, lx: x(e.date) }));
  let lastLx = -Infinity, row = 0;
  const rows = labelled.map(({ lx }) => {
    row = lx - lastLx < 72 ? (row + 1) % 2 : 0;
    lastLx = lx;
    return row;
  });

  const years: string[] = [];
  for (let yr = Number(today.slice(0, 4)) + 1; yr <= Number(horizonEnd.slice(0, 4)); yr++) years.push(String(yr));

  return (
    <div className="mt-[26px] overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('tlChartSummary', { from: today, to: horizonEnd, score: startScore, n: events.length })}
        style={{ minWidth: 560, width: '100%', display: 'block' }}
      >
        {/* goal band + goal / minimum lines */}
        <rect x={PL} y={TOP} width={W - PL - PR} height={Math.max(0, y(goal) - TOP)} fill="var(--ink)" opacity="0.045" />
        <line x1={PL} y1={y(goal)} x2={W - PR} y2={y(goal)} stroke="var(--muted)" strokeWidth="0.75" strokeDasharray="1 5" />
        <text x={W - PR} y={y(goal) - 6} fontSize="10" fill="var(--muted)" textAnchor="end" letterSpacing="1">{t('tlGoalLine', { n: goal })}</text>
        <line x1={PL} y1={y(MIN_POINTS)} x2={W - PR} y2={y(MIN_POINTS)} stroke="var(--hair)" strokeWidth="0.75" strokeDasharray="1 5" />
        <text x={W - PR} y={y(MIN_POINTS) + 14} fontSize="10" fill="var(--muted)" textAnchor="end" letterSpacing="1">{t('tlMinLine', { n: MIN_POINTS })}</text>

        {/* area + step line */}
        <path d={area} fill="var(--ink)" opacity="0.06" />
        <path d={d} fill="none" stroke="var(--ink)" strokeWidth="1.75" />

        {/* today */}
        <line x1={PL} y1={TOP} x2={PL} y2={AXIS} stroke="var(--hair)" strokeWidth="1" />
        <text x={PL} y={TOP - 10} fontSize="10" fill="var(--muted)" letterSpacing="2">{t('tlToday')}</text>
        <text x={PL + 12} y={y(startScore) - 8} fontSize="17" fontFamily="var(--font-serif)" fill="var(--ink)">{startScore}</text>

        {/* events */}
        {events.map((e, i) => {
          const ex = x(e.date);
          const rowY = rows[i] * 28;
          const short = e.causes.map((c) => t(c.labelKey, c.params)).join(' · ');
          if (e.warning) {
            return (
              <g key={e.date}>
                <line x1={ex} y1={TOP + 24} x2={ex} y2={AXIS} stroke="var(--danger)" strokeWidth="0.75" strokeDasharray="3 3" />
                <rect x={ex - 4} y={TOP + 16} width="8" height="8" transform={`rotate(45 ${ex} ${TOP + 20})`} fill="none" stroke="var(--danger)" strokeWidth="1.25" />
                <text x={ex} y={AXIS + 22 + rowY} fontSize="9.5" fill="var(--danger)" textAnchor="middle">{e.date}</text>
                <text x={ex} y={AXIS + 36 + rowY} fontSize="10" fill="var(--danger)" textAnchor="middle">{short}</text>
              </g>
            );
          }
          const isEnd = e.causes.some((c) => c.kind === 'eligibilityEnd');
          const ey = y(e.scoreAfter);
          return (
            <g key={e.date}>
              {isEnd ? (
                <>
                  <line x1={ex - 5} y1={ey - 5} x2={ex + 5} y2={ey + 5} stroke="var(--danger)" strokeWidth="1.5" />
                  <line x1={ex - 5} y1={ey + 5} x2={ex + 5} y2={ey - 5} stroke="var(--danger)" strokeWidth="1.5" />
                </>
              ) : (
                <circle cx={ex} cy={ey} r="4" fill={e.delta >= 0 ? 'var(--ink)' : 'none'} stroke={e.delta >= 0 ? 'var(--ink)' : 'var(--danger)'} strokeWidth="1.5" />
              )}
              <text x={ex} y={e.delta >= 0 ? ey - 14 : ey + 24} fontSize="16" fontFamily="var(--font-serif)" fill={e.delta >= 0 ? 'var(--ink)' : 'var(--danger)'} textAnchor="middle">{e.scoreAfter}</text>
              <text x={ex} y={AXIS + 22 + rowY} fontSize="9.5" fill="var(--muted)" textAnchor="middle">{e.date}</text>
              <text x={ex} y={AXIS + 36 + rowY} fontSize="10" fill={e.delta < 0 || isEnd ? 'var(--danger)' : 'var(--ink)'} textAnchor="middle">{short}</text>
            </g>
          );
        })}

        {/* axis + year ticks */}
        <line x1={PL} y1={AXIS} x2={W - PR} y2={AXIS} stroke="var(--ink)" strokeWidth="1" />
        {years.map((yr) => (
          <text key={yr} x={x(`${yr}-01`)} y={H - 4} fontSize="9.5" fill="var(--muted)" opacity="0.7" textAnchor="middle">{yr}</text>
        ))}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Mount in TimelineSection + sr-only list**

Replace the `{/* TimelineChart mounts here in Task 6 */}` comment with:

```tsx
{hasAnyDate && timeline.events.length > 0 && (
  <>
    <TimelineChart timeline={timeline} goal={goal} today={today} />
    <ol className="sr-only">
      {timeline.events.map((e) => (
        <li key={e.date}>
          {e.date}: {e.causes.map((c) => t(c.labelKey, c.params)).join(', ')}
          {e.delta !== 0 ? ` (${e.delta > 0 ? '+' : ''}${e.delta} → ${e.scoreAfter})` : ''}
        </li>
      ))}
    </ol>
  </>
)}
{hasAnyDate && timeline.events.length === 0 && (
  <p className="mt-[26px] mb-0 text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('tlEmpty')}</p>
)}
```

Also show `t('tlOver45')` (danger color) instead of the chart when the user is already 45+: `isYm(dates.birth) && monthsBetween(dates.birth, today) >= 45 * 12`.

Tailwind v4 provides `sr-only`; verify it renders `position: absolute; clip: …` in devtools.

- [ ] **Step 3: Verify in browser**

`npm run dev` + Playwright on http://localhost:3000:
1. birth 1995-03, english 2024-06, card A overseas start 2021-11, assessment 2025-09 with 261313 → chart shows: +5 milestone 2026-11, warning flags 2027-06 (english) and 2027-09 (ACS), −5 drop 2028-03.
2. Both themes (colors follow tokens), both languages, 320px viewport (horizontal scroll inside the section only).
3. `document.querySelectorAll('[role="img"]')` has the aria-label summary; sr-only list present.

- [ ] **Step 4: Run full checks**

Run: `npm test && npx tsc --noEmit && npx next build`
Expected: green/clean/compiles.

- [ ] **Step 5: Commit**

```bash
git add src/components/TimelineChart.tsx src/components/TimelineSection.tsx
git commit -m "feat: SVG score-projection chart with expiry flags"
```

---

### Task 7: Dynamic OG image

**Files:**
- Create: `src/app/HomeClient.tsx` (moved from page.tsx)
- Rewrite: `src/app/page.tsx` (server component + generateMetadata)
- Create: `src/lib/og.ts`
- Create: `src/app/api/og/route.tsx`
- Create: `src/app/api/og/NotoSerifSC-sub.otf` (subset font asset)
- Test: `tests/og.test.ts`

**Interfaces:**
- Consumes: `parseStateFromParams` (Task 2), `evaluate` (`@/lib/points`), `cardPalettes` (`@/data/cardThemes`).
- Produces: `buildOgQuery(state: AppState, lng: string | null): string` returning `s=<score>&l=<zh|en>[&occ=a|b|c][&e=189|190|491]`.

- [ ] **Step 1: Write the failing test for buildOgQuery**

```ts
// tests/og.test.ts
import { describe, expect, it } from 'vitest';
import { buildOgQuery } from '@/lib/og';
import { defaultPlanningDates, defaultSharedCriteria, newJob } from '@/lib/types';

const state = (jobs = [newJob()]) => ({
  shared: { ...defaultSharedCriteria, age: '25-32', english: 'ielts8', education: 'bachelor', partnerStatus: 'single' },
  jobs,
  dates: { ...defaultPlanningDates },
});

describe('buildOgQuery', () => {
  it('carries the bare score and language', () => {
    const q = new URLSearchParams(buildOgQuery(state(), 'zh-CN'));
    expect(q.get('s')).toBe('75');
    expect(q.get('l')).toBe('zh');
  });

  it('lists English occupation names and eligible pathway codes', () => {
    const j = { ...newJob(), anzsco: '261313' };
    const q = new URLSearchParams(buildOgQuery(state([j]), null));
    expect(q.get('occ')).toBe('Software Engineer');
    expect(q.get('e')).toContain('189');
    expect(q.get('l')).toBe('en');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/og.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/og.ts`**

```ts
import { evaluate } from './points';
import type { AppState } from './urlState';

/** Query string for /api/og derived from parsed URL state (server-safe) */
export function buildOgQuery(state: AppState, lng: string | null): string {
  const ev = evaluate(state.shared, state.jobs);
  const q = new URLSearchParams();
  q.set('s', String(ev.bareScore));
  q.set('l', lng?.startsWith('zh') ? 'zh' : 'en');
  const occ = ev.jobs.map((je) => je.occupation?.en).filter(Boolean).slice(0, 3) as string[];
  if (occ.length) q.set('occ', occ.join('|'));
  const codes = [...new Set(ev.jobs.flatMap((je) => je.pathways.filter((p) => p.eligible).map((p) => p.code)))];
  if (codes.length) q.set('e', codes.join('|'));
  return q.toString();
}
```

Run: `npm test -- tests/og.test.ts` → PASS.

- [ ] **Step 4: Split page.tsx into server wrapper + HomeClient**

`git mv src/app/page.tsx src/app/HomeClient.tsx`; inside, rename the default export `Home` → `HomeClient` (keep `'use client'` and everything else). New `src/app/page.tsx`:

```tsx
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { parseStateFromParams } from '@/lib/urlState';
import { buildOgQuery } from '@/lib/og';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') params.set(k, v);
  }
  const state = parseStateFromParams(params);
  if (!state) return {};   // no shared state → inherit the static metadata from layout
  const img = `/api/og?${buildOgQuery(state, params.get('lng'))}`;
  const description = 'Calculate your EOI points for Australian immigration easily and accurately';
  return {
    openGraph: { title: 'EOI Points Calculator', description, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: 'EOI Points Calculator', description, images: [img] },
  };
}

export default function Page() {
  return <HomeClient />;
}
```

- [ ] **Step 5: Generate the subset font asset**

```bash
curl -L -o /tmp/NotoSerifSC-Medium.otf \
  "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Serif/OTF/SimplifiedChinese/NotoSerifSC-Medium.otf"
uvx --from fonttools pyftsubset /tmp/NotoSerifSC-Medium.otf \
  --unicodes="U+0020-007E,U+00B7,U+5206" \
  --output-file=src/app/api/og/NotoSerifSC-sub.otf
ls -la src/app/api/og/NotoSerifSC-sub.otf   # expect roughly 10-40 KB
```

(U+5206 = 分, U+00B7 = ·. If the download URL 404s, fetch any Noto Serif SC Medium OTF release asset from github.com/googlefonts/noto-cjk and note the URL in the commit body.)

- [ ] **Step 6: Implement the edge route**

```tsx
// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { cardPalettes } from '@/data/cardThemes';

export const runtime = 'edge';

const C = cardPalettes.cream;
const fontData = fetch(new URL('./NotoSerifSC-sub.otf', import.meta.url)).then((r) => r.arrayBuffer());

function card(score: number, lang: 'zh' | 'en', occ: string[], eligible: string[]) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.ink, padding: '56px 72px', fontFamily: 'Serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${C.ink}`, paddingBottom: 18 }}>
        <span style={{ fontSize: 26, letterSpacing: 8, color: C.muted }}>EOI POINTS</span>
        <span style={{ fontSize: 24, color: C.muted }}>189 · 190 · 491</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, marginTop: 30 }}>
        <span style={{ fontSize: 240, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 40, color: C.muted, paddingBottom: 30 }}>{lang === 'zh' ? '分' : 'pts'}</span>
        <span style={{ fontSize: 26, color: C.soft, paddingBottom: 36, marginLeft: 'auto' }}>
          {eligible.length ? eligible.join(' · ') : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 10 }}>
        {occ.map((name) => (
          <span key={name} style={{ fontSize: 30, color: C.soft, borderTop: `1px solid ${C.hair}`, paddingTop: 10 }}>{name}</span>
        ))}
        <span style={{ fontSize: 20, color: C.muted, marginTop: 12 }}>eoi-points-calculator.vercel.app</span>
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  const font = { name: 'Serif', data: await fontData, weight: 500 as const };
  const opts = {
    width: 1200, height: 630, fonts: [font],
    headers: { 'cache-control': 'public, immutable, no-transform, max-age=31536000' },
  };
  try {
    const p = new URL(req.url).searchParams;
    const score = Math.max(0, Math.min(200, Number(p.get('s')) || 0));
    const lang = p.get('l') === 'zh' ? 'zh' as const : 'en' as const;
    const occ = (p.get('occ') || '').split('|').filter(Boolean).slice(0, 3);
    const eligible = (p.get('e') || '').split('|').filter(Boolean).slice(0, 3);
    return new ImageResponse(card(score, lang, occ, eligible), opts);
  } catch {
    // Malformed input must never 500 — serve a generic card
    return new ImageResponse(card(0, 'en', [], []), opts);
  }
}
```

- [ ] **Step 7: Verify**

```bash
npx tsc --noEmit && npm test && npx next build
```
Expected: clean; build output lists `ƒ /` (dynamic) and `/api/og` as an edge function.

```bash
npm run dev &
curl -s -o /tmp/og.png -w "%{http_code} %{content_type}\n" \
  "http://localhost:3000/api/og?s=85&l=zh&occ=Software%20Engineer|Chemical%20Engineer&e=189|190"
```
Expected: `200 image/png`. Open /tmp/og.png and check: cream card, big 85, 分, both names, 189 · 190. Also curl the page HTML with `?a=25-32&jobs=261313:::0` and grep for `og:image.*api/og`; without params grep for the static `og-image.png`.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/app/HomeClient.tsx src/lib/og.ts src/app/api/og/route.tsx src/app/api/og/NotoSerifSC-sub.otf tests/og.test.ts
git commit -m "feat: dynamic per-score Open Graph image"
```

---

### Task 8: Final verification & docs

**Files:**
- Modify: `README.md` (feature list — one bullet each for timeline and dynamic OG)

- [ ] **Step 1: Full-suite run**

```bash
npm test && npx tsc --noEmit && npx next build
```
Expected: every test green, clean types, successful build.

- [ ] **Step 2: End-to-end browser pass (Playwright on dev server)**

1. Fresh profile → fill shared criteria + occupation 261313 + dates (birth 1995-03, english 2024-06, overseas start 2021-11, assessment 2025-09) → chart shows milestone/warnings/drop; URL carries `b/et` + job date segments; reload restores; copy the URL, open in a new context → identical state.
2. Locked selects show 已由日期推导 and clear correctly.
3. `?lng=zh` preserved; language toggle updates section copy.
4. Reset clears dates + chart.
5. Export card and results band unaffected (score matches derived brackets).

- [ ] **Step 3: Update README + commit**

Add under the feature list: score timeline (date-driven projection incl. credential expiry) and dynamic OG image. Then:

```bash
git add README.md
git commit -m "docs: README entries for timeline and dynamic OG"
```

- [ ] **Step 4: Report**

Summarize verification evidence; hand back for /ship (PR + merge) on user confirmation.
