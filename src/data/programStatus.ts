// Snapshot of each state/territory's overall 190/491 intake status.
// This moves independently of — and much faster than — occupation-list membership
// (see stateLists.ts): states open and close ROI/EOI intake through the program
// year as their allocation fills, well before the occupation list itself changes.
// A stale badge here is far more likely than a stale occupation list, so treat
// `asOf` as a hard expiry hint in the UI, not just metadata.
//
// Researched 2026-07 directly against each state's official page (see stateLists.ts
// `url`), current for the 2025–26 program year:
// - NSW: both 190 and 491 carry an "Important Notice" (updated 2026-06-19) that
//   2025–26 places are fully allocated; NSW is reviewing settings for 2026-27.
// - VIC: ROI intake for both visas stopped 30 Apr 2026 (2025-26 allocation met);
//   2026-27 program not yet opened.
// - QLD: ROI intake closed, 2025-26 allocation exhausted; 2026-27 list not published.
// - WA: still running invitation rounds under the 2025-26 WASMOL/GOL framework
//   (a trades round ran 20 May 2026); no closure notice found.
// - SA: ROI intake closed 9am, 2 June 2026; 2026-27 list not yet published.
// - TAS: fully delivered its 2025-26 nomination program (all 1,200 subclass-190
//   and 650 subclass-491 places used) by early-to-mid July 2026; ROI Gateway and
//   application portal closed for maintenance pending 2026-27. (Earlier research
//   in this file had this as "open" based on the state-connected pathways'
//   normal year-round intake — corrected 2026-07 once the program's actual
//   mid-2026 exhaustion was found.)
// - ACT: application portal down for the 2026-27 transition from the week of
//   13 Jul 2026, scheduled to reopen the week of 27 Jul 2026 — temporary, not a
//   program-wide closure.
// - NT: GSM portal closed since it hit its full 2025–26 allocation (~March 2026,
//   1,650 places); reopening pending 2026-27 allocation confirmation.
import type { StateCode } from './stateLists';

export type ProgramStatus = 'open' | 'closed' | 'limited';

export interface ProgramStatusInfo {
  status: ProgramStatus;
  /** Snapshot month (YYYY-MM) this status was last verified against the official page */
  asOf: string;
}

export const programStatus: Record<StateCode, ProgramStatusInfo> = {
  NSW: { status: 'closed', asOf: '2026-07' },
  VIC: { status: 'closed', asOf: '2026-07' },
  QLD: { status: 'closed', asOf: '2026-07' },
  WA: { status: 'open', asOf: '2026-07' },
  SA: { status: 'closed', asOf: '2026-07' },
  TAS: { status: 'closed', asOf: '2026-07' },
  ACT: { status: 'limited', asOf: '2026-07' },
  NT: { status: 'closed', asOf: '2026-07' },
};
