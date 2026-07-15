// Subclass 191 (Permanent Residence — Skilled Regional) — the visa 491/494
// holders transition to once they meet the regional-residence and income
// conditions.
//
// Researched 2026-07. immi.homeaffairs.gov.au's eligibility criteria load via
// client-side calls that automated fetches can't reach (only nav chrome
// returns); figures below are corroborated across 5+ independent
// migration-agency sources. Re-verify against the official page before
// relying on this for a real application.
export const PR191_HOLDING_YEARS = 3;
// The 3 years need not be continuous — periods that total at least 3 years
// are accepted, provided the applicant otherwise stays compliant with visa
// condition 8579 (live / work / study only in a designated regional area,
// which excludes Sydney, Melbourne, Brisbane, Gold Coast and Perth).

export const PR191_INCOME_YEARS_REQUIRED = 3;
export const PR191_VISA_VALIDITY_YEARS = 5;
/**
 * As of a 2024 policy change there is NO fixed minimum taxable-income dollar
 * figure — the requirement is 3 lodged ATO Notices of Assessment (any
 * reported income counts) within the visa's 5-year validity. This reverses
 * the older, commonly-cited ~$53,900 threshold; treat that figure as retired.
 * Source: immi.homeaffairs.gov.au news item "Income requirement for the
 * Subclass 191 visa" (existence confirmed, full text unreachable) —
 * corroborated by racc.net.au, sellanesclark.com, ausstudyvisa.com.au.
 */
export const PR191_HAS_INCOME_THRESHOLD = false;

export interface Pr191Fees {
  primary: number;
  /** Secondary applicant 18+ */
  partner: number;
  /** Secondary applicant under 18 */
  child: number;
}

/** AUD, from 1 Jul 2026 CPI indexation (was $505 / $250 / $130). */
export const PR191_APPLICATION_FEE: Pr191Fees = { primary: 630, partner: 315, child: 160 };
