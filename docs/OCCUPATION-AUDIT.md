# Occupation-list audit — 2025–26 program year

**Audited:** 2026-07 · **Scope:** federal 189/190/491 occupation-list model + 8 state/territory 190/491 lists
· **Files:** `src/data/occupations.ts`, `src/data/stateLists.ts`, `src/data/pointsCriteria.ts`

This records a research + audit pass against official sources and the changes applied. Data changes
are data-driven (in `src/data/`) — nothing was hardcoded into UI or the engine.

## Executive summary

- **The MLTSSL / STSOL / ROL model is correct** for the points-tested visas (189/190/491). The
  December 2024 **CSOL** reform applies to the Skills in Demand **subclass 482** only — it does **not**
  touch 189/190/491. No structural change needed. *(High confidence — primary legislation.)*
- **Gate logic in `pointsCriteria.ts` is right:** 189 = MLTSSL; 190 = MLTSSL+STSOL; 491 = MLTSSL+STSOL+ROL.
- **Fixed (P0):** three ICT occupations were mislabelled `MLTSSL` but are `STSOL`, which falsely granted
  subclass-189 eligibility.
- **Fixed (P1):** VIC, TAS and NT have **no fixed occupation list** — they accept any federally-eligible
  occupation and select competitively. They are now modelled as open lists.
- **Fixed (P2):** provenance comments + ACT list name corrected.

## Legal basis

- **Instrument:** *Migration (LIN 19/051) Instrument 2019* — register ID **F2019L00278**, in force;
  latest compilation **F2026C00265** (28 Mar 2026). Sections 8/9/10 define MLTSSL / STSOL / ROL.
- **CSOL:** created by *Migration (Specification of Occupations—Subclass 482 Visa) Instrument 2024*
  (**F2024L01620 / LIN 24/089**, commenced 7 Dec 2024) for subclass 482, plus subclass 186 (F2024L01618).
  Scoped to 482/186 — **not** 189/190/491.
- Two research-pass claims were **dropped as refuted**: (a) that 189/190 migrated to CSOL while 491 did
  not (all three remain MLTSSL-based); (b) `F2019C00855` as the "latest compilation" (superseded 2019 doc).

## Changes applied

### P0 — federal reclassification (`occupations.ts`)

Currently `MLTSSL`, corrected to `STSOL` (removes false 189 eligibility; 190/491 unaffected since both include STSOL):

| ANZSCO | Occupation             | Was    | Now   | Confidence |
|--------|------------------------|--------|-------|------------|
| 262113 | Systems Administrator  | MLTSSL | STSOL | high       |
| 261314 | Software Tester        | MLTSSL | STSOL | high       |
| 262111 | Database Administrator | MLTSSL | STSOL | high       |

Cleared (already correct, no change): `221214` Internal Auditor (MLTSSL), `241213` Primary School
Teacher (STSOL), `261111` ICT Business Analyst (MLTSSL), `261112` Systems Analyst (MLTSSL).

### P1 — no-fixed-list states (`stateLists.ts`)

VIC, TAS and NT do not gate on a published occupation list — they accept any occupation on the relevant
federal SOL and select competitively (ROI / Canberra-style matrix). They are now `openListStates`:
`statesListing()` returns them for any occupation that passes the federal gate, instead of the previous
narrow sector groups which wrongly excluded valid occupations. Their sector entries remain as indicative
**priority sectors** only.

### P2 — provenance / naming

- `occupations.ts` header now cites F2019L00278 and states the CSOL exclusion explicitly.
- ACT description corrected: "Critical Skills List" → "ACT Nominated Migration Program Occupation List
  + Canberra Matrix" (both locales).

## Per-state program structure (verified) vs list membership (approximated)

Program **structure** (fixed-list-or-not, selection method) was verified at high confidence. Actual
per-state ANZSCO **membership** for the fixed-list states is a curated sector-group approximation —
reference only.

| State | Fixed list? | Selection mechanism |
|-------|-------------|---------------------|
| NSW | Yes (190 & 491, published at 4-digit unit-group) | Fixed list + EOI invitation rounds |
| VIC | **No** | ROI ranking; accepts any federal-SOL occupation |
| QLD | Yes (QSOL, onshore/offshore) | ROI ranking |
| WA  | Yes (WASMOL Sch 1 & 2 + Graduate) | Fixed list + ranked monthly rounds |
| SA  | Yes (single list, per-occupation 190/491 flags) | ROI (onshore) / EOI (offshore) |
| TAS | **No** | ROI ranking with priority pass categories |
| ACT | Yes (ACT Nominated Migration Program Occupation List) | Fixed list + Canberra Matrix |
| NT  | **No** onshore (offshore Priority stream uses NTOMOL) | EOI/registration, weighted |

## Confidence & remaining gaps

- **High:** federal legal basis, CSOL determination, the three reclassifications, per-state program structure.
- **Low:** exact ANZSCO membership of each state's live list (sector-group approximations, unverified).
- **Done since (follow-up):** the occupation list is now **complete** — all 504 occupations from the
  LIN 19/051 schedules (MLTSSL 212 + STSOL 215 + ROL 77), replacing the earlier ~70-item curated subset.
  Counts were verified against the official totals, and the retired codes the old subset carried
  (`135111` Chief Information Officer, `399999` Technicians and Trades Workers nec — not on any current
  list) were dropped. `immi.homeaffairs.gov.au` still returns HTTP 403 to automated fetches, so the list
  was compiled from the LIN 19/051 schedule tables rather than the rendered Home Affairs page.
- **Not done (future work):**
  - Replace fixed-list-state sector approximations (NSW, QLD, WA, SA, ACT) with the actual published
    ANZSCO codes (NSW publishes at 4-digit unit-group level).
  - Program allocations for QLD/TAS/NT 2025–26 are already exhausted — consider surfacing a
    "program may be closed" caveat.

Re-verify at the start of each program year; a future GSM list consolidation was signalled but had not
taken effect as of July 2026.
