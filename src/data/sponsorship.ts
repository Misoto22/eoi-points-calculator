// Employer-sponsored pathways — subclass 482 (Skills in Demand) and 186
// (Employer Nomination Scheme). Unlike 189/190/491 these are NOT points-tested:
// eligibility is a checklist (sponsor + occupation gate + salary/experience/
// age/English thresholds), so this file holds thresholds, not point values.
//
// Researched live against immi.homeaffairs.gov.au 2026-07-15 (site content,
// pricing API and CSOL data API — not cached/archived pages) plus a dedicated
// subclass 186 sweep. Re-verify before relying on this for a real application.
export type SponsorshipStreamCode = '482core' | '482specialist' | '186direct' | '186trt';

/** AUD, current 1 Jul 2026 – 30 Jun 2027 program year (indexed annually). */
export const CSIT = 79423;
/** AUD, current 1 Jul 2026 – 30 Jun 2027 program year (indexed annually). */
export const SSIT = 146576;

export type SalaryBand = '' | 'belowCsit' | 'csitToSsit' | 'ssitPlus';

/** Minimum years of relevant work experience the stream requires. */
export const EXPERIENCE_YEARS_REQUIRED: Record<SponsorshipStreamCode, number> = {
  '482core': 1,
  '482specialist': 1,
  // Standard Direct Entry work-experience rule, unchanged by the Nov 2023 TRT reform.
  '186direct': 3,
  // Cumulative time on the nominating employer's 482/457 in the nominated
  // occupation — reduced from 3 to 2 years in Nov 2023. Modelled here as a
  // single `trtEligible` checkbox rather than derived from job dates, since
  // it specifically requires *sponsored* employment with the *nominating*
  // employer — a fact the calculator's general work-history fields don't capture.
  '186trt': 2,
};

/** Both 186 streams share the standard under-45 age ceiling (exemptions exist but aren't modelled here). */
export const ENS_AGE_LIMIT = 45;

/** AUD, subclass 482 visa application charges — identical across all three streams. */
export const visa482Charge = { primary: 4015, partner: 4015, child: 1005 };
/** AUD, subclass 186 visa application charges — same figure used elsewhere in the app for 190/491. */
export const visa186Charge = { primary: 6140, partner: 3070, child: 1535 };

/** AUD, employer-paid — shown for context only, never added to the applicant's fee estimate. */
export const employerCosts = {
  standardBusinessSponsorApproval: 420,
  nomination482: 330,
  nomination186: 540,
  /** Per year of the nomination period, charged up front. */
  safLevy482: { small: 1200, other: 1800 },
  /** One-off. */
  safLevy186: { small: 3000, other: 5000 },
};

export const VISA_VALIDITY_YEARS_482 = 4;
/** 5 years for Hong Kong SAR passport holders — not modelled as a separate input. */
export const VISA_VALIDITY_YEARS_482_HK = 5;

export interface SponsorshipStreamInfo {
  code: SponsorshipStreamCode;
  visa: '482' | '186';
}

export const sponsorshipStreams: SponsorshipStreamInfo[] = [
  { code: '482core', visa: '482' },
  { code: '482specialist', visa: '482' },
  { code: '186direct', visa: '186' },
  { code: '186trt', visa: '186' },
];
