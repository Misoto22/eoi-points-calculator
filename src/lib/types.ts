export interface SharedCriteria {
  age: string;
  english: string;
  education: string;
  partnerStatus: string;
  stem: boolean;
  ausStudy: boolean;
  regionalStudy: boolean;
  communityLanguage: boolean;
}

/** One skills assessment — occupation-bound criteria are entered per job */
export interface JobAssessment {
  id: string;
  anzsco: string;
  ausWork: string;
  overseasWork: string;
  professionalYear: boolean;
  ausWorkStart: string;
  /** '' = still working (ongoing) */
  ausWorkEnd: string;
  overseasWorkStart: string;
  /** '' = still working (ongoing) */
  overseasWorkEnd: string;
  assessmentDate: string;
}

/** Optional month-precision dates powering the score timeline (all YYYY-MM or '') */
export interface PlanningDates {
  birth: string;
  englishTest: string;
  naatiCert: string;
  /** 491/494 visa grant month — powers the subclass 191 (permanent) eligibility projection */
  visa491Grant: string;
}

export const defaultPlanningDates: PlanningDates = { birth: '', englishTest: '', naatiCert: '', visa491Grant: '' };

/** Month-string guard shared by url parsing, timeline math and inputs */
export function isYm(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export const defaultSharedCriteria: SharedCriteria = {
  age: '',
  english: '',
  education: '',
  partnerStatus: '',
  stem: false,
  ausStudy: false,
  regionalStudy: false,
  communityLanguage: false,
};

/** Inputs for the employer-sponsorship checklist (482/186) — persisted separately from the points-tested state. */
export interface SponsorshipInputs {
  hasSponsor: boolean;
  salaryBand: '' | 'belowCsit' | 'csitToSsit' | 'ssitPlus';
  /** Cumulative ≥2 years on the nominating employer's 482/457 in the nominated occupation (186 TRT gate) */
  trtEligible: boolean;
}

export const defaultSponsorshipInputs: SponsorshipInputs = {
  hasSponsor: false,
  salaryBand: '',
  trtEligible: false,
};

let jobSeq = 0;

export function newJob(): JobAssessment {
  jobSeq += 1;
  return {
    id: `j${Date.now().toString(36)}${jobSeq}`,
    anzsco: '',
    ausWork: '',
    overseasWork: '',
    professionalYear: false,
    ausWorkStart: '',
    ausWorkEnd: '',
    overseasWorkStart: '',
    overseasWorkEnd: '',
    assessmentDate: '',
  };
}
