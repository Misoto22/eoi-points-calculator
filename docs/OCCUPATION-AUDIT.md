# Occupation-list audit — 2025–26 program year

**Audited:** 2026-07 (updated 2026-07: fixed-list states' real ANZSCO membership added) · **Scope:**
federal 189/190/491 occupation-list model + 8 state/territory 190/491 lists
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

## Per-state program structure and list membership (both verified 2026-07)

| State | Fixed list? | Selection mechanism |
|-------|-------------|---------------------|
| NSW | Yes (190 & 491, published at 4-digit unit-group) | Fixed list + EOI invitation rounds |
| VIC | **No** — confirmed genuinely open, no ceiling mechanism | ROI ranking; accepts any federal-SOL occupation |
| QLD | Yes (Onshore + Offshore Skilled Occupation Lists) | ROI ranking |
| WA  | Yes (WASMOL Sch 1 & 2 + Graduate) | Fixed list + ranked monthly rounds |
| SA  | Yes (single list, per-occupation 190/491 flags) | ROI (onshore) / EOI (offshore) |
| TAS | **No** for the common (Tasmania-connected) case; fixed ~83-code list gates the offshore-no-ties 190 pathway only | ROI ranking with priority pass categories |
| ACT | Yes (ACT Nominated Migration Program Occupation List, Oct 2025) — hard gate, not just ranking | Fixed list + Canberra Matrix |
| NT  | **No** for 190 (onshore-only, no list) or for 3 of 4 offshore-491 streams; 139-code NTOMOL gates only the offshore-no-ties 491 stream | EOI/registration, weighted |

`stateLists.ts` now carries each fixed-list state's actual published ANZSCO membership (one row per
occupation, `[anzsco, eligible190, eligible491]`), replacing the earlier sector-group approximation.
Cross-checked against `occupations.ts`: every code referenced by every state list already exists there
— zero gaps found, so no federal-list additions were needed for this pass.

## Confidence & remaining gaps

- **High:** federal legal basis, CSOL determination, the federal-list reclassifications, per-state
  program structure, and (new) per-state ANZSCO list membership — each compiled directly from the
  state's own published list/table, with source URL and effective date recorded in `stateLists.ts`.
- **Known simplifications** (see per-state comments in `stateLists.ts` for detail): stream-level nuance
  collapsed to "eligible if any stream lists it" (NSW Pathway 1, WA's 6-month-contract requirement, SA's
  4-stream flags, ACT's Small Business Owner carve-out); QLD's offshore list (subset of onshore) is not
  carried separately; VIC/TAS/NT's narrow list-gated sub-pathways are not modelled (see `openListStates`
  doc comment) since the app has no onshore/offshore/stream input dimension.
- Several 2025–26 program allocations (NSW, QLD, SA, WA) had exhausted their intake and paused new
  applications at the time of research (2026-07), with 2026-27 lists not yet published — list
  *membership* recorded is the most recently published version, not a live application-status feed.
- **Done since (follow-up):** the federal occupation list is complete (504 occupations, MLTSSL 212 +
  STSOL 215 + ROL 77) and every fixed-list state's real ANZSCO membership has been researched and
  applied — the prior "not done" gap here is closed.

Re-verify at the start of each program year (state lists commonly refresh around 1 July, sometimes with
a lag); a future GSM list consolidation was signalled but had not taken effect as of July 2026.
