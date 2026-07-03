// EOI points criteria — source: immi.homeaffairs.gov.au (Skilled Migration Points Test)
// Last updated: 2026-03
// Single source of truth for every point value, pathway rule and threshold.
// UI components and the calculation engine must read from here — never inline values.

export type OccupationListId = 'MLTSSL' | 'STSOL' | 'ROL';
export type VisaCode = '189' | '190' | '491';

export interface PointOption {
  /** Stable value used in state, URL params and i18n label keys */
  value: string;
  points: number;
}

/** Criteria that belong to the applicant and are shared across all skills assessments */
export const sharedSelectCriteria = {
  age: [
    { value: '18-24', points: 25 },
    { value: '25-32', points: 30 },
    { value: '33-39', points: 25 },
    { value: '40-44', points: 15 },
  ],
  english: [
    { value: 'ielts6', points: 0 },
    { value: 'ielts7', points: 10 },
    { value: 'ielts8', points: 20 },
  ],
  education: [
    { value: '', points: 0 },
    { value: 'apprenticeship', points: 10 },
    { value: 'cert3', points: 10 },
    { value: 'diploma', points: 10 },
    { value: 'bachelor', points: 15 },
    { value: 'phd', points: 20 },
  ],
  partnerStatus: [
    { value: '', points: 0 },
    { value: 'single', points: 10 },
    { value: 'partnerSkills', points: 10 },
    { value: 'partnerCitizen', points: 10 },
    { value: 'partnerEnglish', points: 5 },
  ],
} satisfies Record<string, PointOption[]>;

export type SharedSelectField = keyof typeof sharedSelectCriteria;

/** Checkbox bonuses shared across all assessments */
export const sharedBonusCriteria = {
  stem: 10,
  ausStudy: 5,
  regionalStudy: 5,
  communityLanguage: 5,
} as const;

export type SharedBonusField = keyof typeof sharedBonusCriteria;

/** Display grouping of the shared bonuses (section 01) */
export const bonusGroups: { id: string; items: SharedBonusField[] }[] = [
  { id: 'edu', items: ['stem', 'ausStudy', 'regionalStudy'] },
  { id: 'lang', items: ['communityLanguage'] },
];

/** Criteria tied to a nominated occupation, entered per skills assessment */
export const jobSelectCriteria = {
  ausWork: [
    { value: '', points: 0 },
    { value: '1-3', points: 5 },
    { value: '3-5', points: 10 },
    { value: '5-8', points: 15 },
    { value: '8-10', points: 20 },
  ],
  overseasWork: [
    { value: '', points: 0 },
    { value: '3-5', points: 5 },
    { value: '5-8', points: 10 },
    { value: '8-10', points: 15 },
  ],
} satisfies Record<string, PointOption[]>;

export type JobSelectField = keyof typeof jobSelectCriteria;

export const professionalYearPoints = 5;

/**
 * Part 6D.5 item 6D51: when an applicant qualifies under both Part 6D.3
 * (overseas employment) and Part 6D.4 (Australian employment) and the
 * combined points exceed 20, exactly 20 points are awarded.
 * Source: Migration Regulations 1994 Schedule 6D (verified 2026-07-03).
 */
export const EMPLOYMENT_EXPERIENCE_CAP = 20;

/**
 * Visa pathways. `lists` is the federal occupation-list gate.
 * `perState` pathways additionally depend on each state's own occupation list
 * (see stateLists.ts) — the nomination bonus is only claimable with a nomination.
 */
export interface Pathway {
  code: VisaCode;
  bonus: number;
  lists: OccupationListId[];
  perState: boolean;
}

export const pathways: Pathway[] = [
  { code: '189', bonus: 0, lists: ['MLTSSL'], perState: false },
  { code: '190', bonus: 5, lists: ['MLTSSL', 'STSOL'], perState: true },
  { code: '491', bonus: 15, lists: ['MLTSSL', 'STSOL', 'ROL'], perState: true },
];

export const MIN_POINTS = 65;
// max = theoretical best base score: shared 105 + capped employment 20 + PY 5
export const GOAL_RANGE = { min: 65, max: 130, step: 5 } as const;
export const MAX_JOBS = 5;

export function optionPoints(options: PointOption[], value: string): number {
  const opt = options.find((o) => o.value === value && value !== '');
  return opt ? opt.points : 0;
}
