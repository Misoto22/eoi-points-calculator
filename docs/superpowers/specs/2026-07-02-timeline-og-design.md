# Score Timeline & Dynamic OG Image — Design

Date: 2026-07-02
Status: approved (visual direction and architecture confirmed with owner)

## Goals

1. **Score timeline (分数推演)** — project the applicant's bare score (裸分) over the
   next years from real dates: age-bracket drops, work-experience milestones, and
   credential expiries (English test, skills assessment, NAATI), rendered as a
   horizontal step chart in the site's editorial style.
2. **Dynamic OG image** — shared links (the URL already carries calculator state)
   render a per-score Open Graph preview image instead of the static og-image.png.

## Decisions already made

- Timeline input model: **optional enhancement**. Existing bracket dropdowns stay;
  dates are optional and live in the timeline section. No dates → no chart.
- Dates **are serialized into the URL** (owner accepted the privacy trade-off) and
  persisted to localStorage.
- Chart visual: **direction A, variant V2** — step curve with a faint area fill,
  goal band above the dashed goal line, warning flags (red dashed vertical +
  diamond) planted in the plot, compact date+label pairs under the axis, serif
  numerals at each step level, "today" marker on the left. Mockups preserved under
  `.superpowers/brainstorm/6616-1782974454/content/`.
- OG architecture: **option 1** — `generateMetadata` on `/` reads searchParams and
  computes the score server-side; `og:image` points to an edge `ImageResponse`
  route. `/` moves from fully static to per-request rendering.

## 1. Data model & URL

All dates are month precision, stored as `YYYY-MM` strings.

Shared (new `PlanningDates` state slice in the page):

| Field         | Meaning                    | URL param |
|---------------|----------------------------|-----------|
| `birth`       | Birth year-month           | `b`       |
| `englishTest` | English test year-month    | `et`      |
| `naatiCert`   | NAATI CCL credential date  | `nc`      |

Per `JobAssessment` (new optional fields):

| Field               | Meaning                     | URL encoding                |
|---------------------|-----------------------------|-----------------------------|
| `ausWorkStart`      | Australian work start       | `jobs=` segment 5           |
| `overseasWorkStart` | Overseas work start         | `jobs=` segment 6           |
| `assessmentDate`    | Skills assessment issue date| `jobs=` segment 7           |

`jobs=` format becomes `anzsco:ausWork:overseasWork:py:ausStart:ovsStart:assessDate`.
Missing trailing segments parse as empty — old links stay valid. Empty trailing
segments are trimmed when serializing so URLs without dates look unchanged.

Persistence: `PlanningDates` under a new localStorage key `eoi-v2-dates`; job date
fields ride along in the existing `eoi-v2-jobs` JSON.

### Derivation & locking

- `birth` set → the `age` select value is derived from today's age and the select
  becomes locked with an "由日期推导 / derived from date" hint; clearing the date
  unlocks it. Same for `ausWorkStart` → `ausWork` and `overseasWorkStart` →
  `overseasWork` (per assessment).
- `englishTest` does **not** derive the English level (it is a test result the
  user picks); it only drives the expiry warning.
- Derived bracket values update the score exactly like manual selection —
  `evaluate()` is unchanged.

## 2. Timeline engine

New pure module `src/lib/timeline.ts` (no DOM, fully unit-tested; `today` is an
injected parameter):

```ts
interface TimelineEvent {
  date: string;                     // YYYY-MM
  kind: 'age' | 'ausWork' | 'overseasWork'
      | 'englishExpiry' | 'assessmentExpiry' | 'naatiExpiry'
      | 'eligibilityEnd';
  jobId?: string;                   // set for per-assessment events
  delta: number;                    // 0 for warnings
  scoreAfter: number;               // bare score after this event
  labelKey: string;                 // i18n key; label params derived from kind
}

function buildTimeline(input: {
  shared: SharedCriteria; jobs: JobAssessment[]; dates: PlanningDates;
  goal: number; today: string;      // YYYY-MM
}): { events: TimelineEvent[]; startScore: number; horizonEnd: string }
```

- **Horizon**: `min(today + 5 years, 45th birthday)`. At the 45th birthday an
  `eligibilityEnd` event terminates the curve (rendered as an × marker).
- **Age events**: crossing 33, 40 (deltas computed from `sharedSelectCriteria`
  bracket values — e.g. 30→25 and 25→15 today — never hard-coded), 45 (end).
- **Work milestones**: from each start date, cumulative years hitting the bracket
  thresholds (aus 1/3/5/8, overseas 3/5/8 — read from `jobSelectCriteria`).
  Assumes continuous full-time work from the start date onward; the 10-year
  look-back window is not modelled. This simplification is stated in the UI note.
- **Score recomputation**: for each event date, substitute the as-of-date bracket
  values into shared/jobs and call the existing `evaluate()`; `scoreAfter` is its
  `bareScore` (max base across assessments). No parallel scoring logic.
- **Expiries** (warnings, delta 0): English = test date + 3 years; assessment =
  issue date + validity from the authority mapping; NAATI = credential date +
  validity (nullable validity = never expires). Expiries beyond the horizon are
  omitted from the chart but the nearest one is still shown in the input panel
  subnote.
- Events in the same month merge into one marker with stacked labels.

### Assessing-authority data

New `src/data/assessingAuthorities.ts`: ANZSCO-prefix rules resolving each
occupation to `{ authority: string; validityYears: number | null }` — e.g. ICT
unit groups (2611–2634, 135x, 313x) → ACS · 2y; engineers (2331–2339) → EA;
accountants (2211) → CPAA/CAANZ/IPA; teachers (241x) → AITSL; nurses (254x) →
ANMAC; trades → TRA; default → VETASSESS · 3y. **Every validity period must be
verified against the authority's official page during implementation**; same for
NAATI CCL expiry (preliminary finding: CCL does not expire — the nullable
validity covers this). The resolved authority name renders under the assessment
date input.

## 3. UI

New section **04 · 分数推演 / TIMELINE** between Result (03) and Reference
(renumbered 04 → 05). Components:

- `TimelineSection.tsx` — section heading, explainer note (incl. the
  continuous-work assumption), date-input panel, chart. Empty state (no dates):
  panel + note only.
  - Shared row: 出生年月 / 英语考试年月 / NAATI 认证年月 (NAATI input only when the
    `communityLanguage` bonus is checked).
  - One row per assessment (tag A/B/…): 澳洲工作起始 / 海外工作起始 / 职业评估获得日
    with authority + expiry subnote. Rows appear/disappear with assessments.
  - Inputs are native `<input type="month">` styled like existing fields
    (Firefox/desktop Safari degrade to text; validate `YYYY-MM` on change).
- `TimelineChart.tsx` — hand-written SVG (no chart lib), V2 style: step line
  (1.75px ink), 6% ink area fill, goal band + dashed goal line, dashed 65 line,
  gain dots (filled ink), loss dots (danger outline), warning flags, per-event
  date + short label under the axis, year ticks, today marker + starting score.
  Fixed min-width 560px with `overflow-x: auto` wrapper on narrow screens.
- A11y: chart wrapper `role="img"` with a generated summary `aria-label`, plus a
  visually-hidden ordered list of events for screen readers.
- i18n: all new strings in `public/locales/{en,zh}/common.json`.

## 4. Dynamic OG image

- Split `src/app/page.tsx`: a server component exporting
  `generateMetadata({ searchParams })` and rendering the existing client page
  (moved to `src/app/HomeClient.tsx` unchanged).
- Refactor `urlState.ts` so parsing works from a `URLSearchParams` argument
  (server-safe), keeping the existing window-reading wrappers.
- `generateMetadata`: no state params → current static metadata (og-image.png).
  With state params → compute `bareScore` via `evaluate()` and set
  `og:image`/`twitter:image` to
  `/api/og?s=<score>&g=<goal>&l=<zh|en>&occ=<up to 3 EN names>&e=<eligible codes>`.
- `src/app/api/og/route.tsx` — edge runtime `ImageResponse`, 1200×630, cream
  palette from `cardThemes`: EOI POINTS masthead + date, large serif score with
  分/pts unit, occupation names (English only) with eligible pathway codes.
  Fonts: subset serif TTF bundled with the route (numerals + Latin + the handful
  of CJK glyphs used, e.g. 分/目标); subsetting happens at build time, checked
  into the repo as a small asset.
- Invalid/malformed params → serve the default card (HTTP 200), never a 500.
- `Cache-Control: public, immutable, max-age=31536000` (image varies only with
  its query string).

## 5. Error handling

- Future `birth`/work-start dates, or birth implying age < 18: inline field hint
  (danger color), the offending date contributes no events, chart still renders
  remaining events.
- Age ≥ 45 today: timeline shows the not-eligible note instead of a curve.
- Work start dates later than "today" are treated as future employment: milestones
  count from that date (valid planning case, not an error).

## 6. Testing

- `tests/timeline.test.ts` — bracket-crossing boundary months (33/40/45), work
  milestones from start dates incl. future starts, expiry computation per
  authority (ACS 2y vs default 3y vs null), horizon cap at 45, multi-assessment
  bare-score max, same-month event merging, delta values read from criteria.
- `tests/urlState.test.ts` — extended `jobs=` segments round-trip, old-format
  links parse, dates params round-trip, foreign params still preserved.
- OG: unit test for the param-builder; `next build` verifies the edge route
  compiles; manual crawler check post-deploy.

## Out of scope

- Modelling the 10-year work window or employment gaps.
- EOI lodgement/expiry tracking (no lodgement date input).
- Timeline data on the exported share card.
- CJK occupation names on the OG image.

## Implementation-time verification list

- [ ] Validity periods per assessing authority (official sources)
- [ ] NAATI CCL expiry policy
- [ ] ANZSCO-prefix → authority mapping audited against the 504-occupation list
- [ ] English test 3-year validity wording (points test: test taken in the 3
      years before invitation)
