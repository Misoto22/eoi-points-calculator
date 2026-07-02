// State / territory nomination lists for subclass 190 and 491.
// Each state keeps its OWN occupation list on top of the federal
// MLTSSL / STSOL / ROL gate — an occupation eligible federally may still
// be absent from a given state's list.
//
// Snapshot of the 2025–26 program year, curated from each state's official
// migration site (see `url` per state). States without a fixed published
// list (VIC ROI, TAS pathways) are represented by their published priority
// sectors. Reference only — always verify on the official page.
// Last updated: 2026-03

import type { VisaCode } from './pointsCriteria';

export type StateCode = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export const stateCodes: StateCode[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

export interface StateInfo {
  code: StateCode;
  url: string;
}

/** Metadata per state; descriptive how/tip strings live in the locale files under `states.<code>` */
export const states: StateInfo[] = [
  { code: 'NSW', url: 'https://www.nsw.gov.au/visas-and-migration' },
  { code: 'VIC', url: 'https://liveinmelbourne.vic.gov.au' },
  { code: 'QLD', url: 'https://migration.qld.gov.au' },
  { code: 'WA', url: 'https://migration.wa.gov.au' },
  { code: 'SA', url: 'https://migration.sa.gov.au' },
  { code: 'TAS', url: 'https://www.migration.tas.gov.au' },
  { code: 'ACT', url: 'https://www.act.gov.au/migration' },
  { code: 'NT', url: 'https://theterritory.com.au/migrate' },
];

// Occupation groups by ANZSCO code, used to compose each state's list.
// Codes must exist in occupations.ts.
const ICT = [
  '261311', '261312', '261313', '261314', '261111', '261112',
  '262111', '262112', '262113', '263111', '263312', '135111', '135112',
];
const ACCOUNTING = ['221111', '221112', '221113', '221213', '221214'];
const ENGINEERING = [
  '233211', '233214', '233311', '233512', '233111', '233411',
  '233911', '233912', '233913', '233999', '312999',
];
const HEALTH = [
  '234611', '254111', '254411', '254499', '254412', '254418', '254421',
  '253111', '253112', '253311', '253511', '252411', '252511', '252711', '251211',
];
const EDUCATION = ['241111', '241411', '241213', '241511'];
const SOCIAL = ['272511', '272311'];
const LEGAL = ['271311', '271111'];
const ARCHITECTURE = ['232111', '232112'];
const SCIENCE_AGRI = ['234111', '234112', '234711'];
const TRADES = ['321211', '334111', '341111', '331111', '331211'];
const HOSPITALITY = ['351311', '351411'];
const BUSINESS = ['224711', '149212', '225113', '232411'];
const ROL_TRADES = ['399999'];

const group = (...groups: string[][]): string[] => Array.from(new Set(groups.flat()));

/**
 * ANZSCO codes on each state's 190 / 491 list.
 * The engine intersects these with the federal pathway gate, so a code may
 * safely appear here even when it is not federally eligible for that visa.
 */
export const stateOccupationLists: Record<StateCode, Record<Extract<VisaCode, '190' | '491'>, string[]>> = {
  // NSW: tiered priority list — ICT, health, engineering, construction first
  NSW: {
    '190': group(ICT, HEALTH, ENGINEERING, EDUCATION, ARCHITECTURE, TRADES),
    '491': group(ICT, HEALTH, ENGINEERING, EDUCATION, ARCHITECTURE, TRADES, ACCOUNTING, SCIENCE_AGRI, HOSPITALITY, ROL_TRADES),
  },
  // VIC: ROI selection, no fixed list — health, teaching, STEM/digital priority sectors
  VIC: {
    '190': group(HEALTH, EDUCATION, ICT, ENGINEERING, SCIENCE_AGRI, SOCIAL),
    '491': group(HEALTH, EDUCATION, ICT, ENGINEERING, SCIENCE_AGRI, SOCIAL, TRADES, HOSPITALITY),
  },
  // QLD: QSOL with onshore / offshore streams
  QLD: {
    '190': group(ICT, HEALTH, ENGINEERING, EDUCATION, TRADES, SCIENCE_AGRI, ACCOUNTING),
    '491': group(ICT, HEALTH, ENGINEERING, EDUCATION, TRADES, SCIENCE_AGRI, ACCOUNTING, HOSPITALITY, SOCIAL, ROL_TRADES),
  },
  // WA: WASMOL schedules — health, construction, mining-adjacent engineering
  WA: {
    '190': group(HEALTH, ENGINEERING, TRADES, ICT, HOSPITALITY),
    '491': group(HEALTH, ENGINEERING, TRADES, ICT, HOSPITALITY, EDUCATION, SCIENCE_AGRI, ROL_TRADES),
  },
  // SA: broadest state list — most onshore-eligible occupations
  SA: {
    '190': group(ICT, HEALTH, ENGINEERING, EDUCATION, ACCOUNTING, SOCIAL, LEGAL, ARCHITECTURE, SCIENCE_AGRI, TRADES, HOSPITALITY, BUSINESS),
    '491': group(ICT, HEALTH, ENGINEERING, EDUCATION, ACCOUNTING, SOCIAL, LEGAL, ARCHITECTURE, SCIENCE_AGRI, TRADES, HOSPITALITY, BUSINESS, ROL_TRADES),
  },
  // TAS: pathway-based (employment / residence), broad sector coverage
  TAS: {
    '190': group(HEALTH, EDUCATION, ICT, ENGINEERING, TRADES, HOSPITALITY, SOCIAL, ACCOUNTING),
    '491': group(HEALTH, EDUCATION, ICT, ENGINEERING, TRADES, HOSPITALITY, SOCIAL, ACCOUNTING, SCIENCE_AGRI, BUSINESS, ROL_TRADES),
  },
  // ACT: Critical Skills List + Canberra Matrix
  ACT: {
    '190': group(ICT, HEALTH, ENGINEERING, EDUCATION, ACCOUNTING, SOCIAL, HOSPITALITY),
    '491': group(ICT, HEALTH, ENGINEERING, EDUCATION, ACCOUNTING, SOCIAL, HOSPITALITY, ARCHITECTURE, BUSINESS),
  },
  // NT: small program — health, trades and territory-critical roles
  NT: {
    '190': group(HEALTH, TRADES, HOSPITALITY, SOCIAL),
    '491': group(HEALTH, TRADES, HOSPITALITY, SOCIAL, EDUCATION, ICT, ENGINEERING, ROL_TRADES),
  },
};

/** States whose 190/491 list includes the given occupation (federal gate NOT applied here) */
export function statesListing(anzsco: string, visa: '190' | '491'): StateCode[] {
  if (!anzsco) return [];
  return stateCodes.filter((s) => stateOccupationLists[s][visa].includes(anzsco));
}
