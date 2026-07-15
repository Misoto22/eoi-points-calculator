// Rough cost-estimate figures for a skilled-migration (GSM) application.
//
// Researched 2026-07. immi.homeaffairs.gov.au's fee pages return HTTP 403 to
// automated fetches; the visa application charges below are corroborated
// across several independent migration-agency sources reporting the 1 Jul
// 2026 fee increase, not read directly from the primary source. Treat every
// figure here as an estimate — spot-check against the official fee schedule
// before relying on it for a real budget.
import type { VisaCode } from './pointsCriteria';
import type { StateCode } from './stateLists';

/** AUD, base (primary) applicant charge, from 1 Jul 2026. */
export const visaApplicationCharge: Record<VisaCode, number> = {
  '189': 6135,
  '190': 6135,
  '491': 6135,
};

/** AUD, flat add-on per secondary applicant, from 1 Jul 2026. */
export const secondaryApplicantCharge = { partner: 3070, child: 1540 };

/** AUD, current. PTE figure is lower-confidence — sources varied $410–$490. */
export const englishTestFee = { ielts: 490, pte: 490 };

/** AUD, current. Only relevant when claiming the NAATI CCL bonus point. */
export const naatiCclFee = 814;

/**
 * AUD, current flat state/territory nomination fee for 190/491 (not
 * occupation-specific). `null` = no single confirmed figure at research time.
 */
export const stateNominationFee: Record<StateCode, number | null> = {
  NSW: 363,
  VIC: 0,
  QLD: 341,
  WA: 200,
  SA: 381,
  TAS: 605,
  ACT: null, // $25 Canberra Matrix submission fee confirmed; the separate post-invitation service fee is unconfirmed
  NT: 300,
};

/**
 * Typical skills-assessment fee (AUD), keyed by the exact authority string
 * `assessingAuthority()` returns. Covers the handful of bodies assessing most
 * occupations; anything else (aviation, maritime, legal, allied-health
 * sub-specialties, etc.) falls back to `assessmentFeeFallbackRange` rather
 * than a fabricated point figure — those bodies' fees vary too widely
 * (e.g. TRA trades range from a $130 provisional check to $5,000+ for a full
 * offshore assessment) to responsibly reduce to one number.
 */
export const assessmentFeeByAuthority: Record<string, number> = {
  ACS: 1498,
  'Engineers Australia': 1034,
  VETASSESS: 1150,
  TRA: 2020,
  'CPAA / CAANZ / IPA': 550,
  AITSL: 1154,
  ANMAC: 595,
};

export const assessmentFeeFallbackRange: [number, number] = [500, 1500];
