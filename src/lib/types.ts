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
}

export const defaultPlanningDates: PlanningDates = { birth: '', englishTest: '', naatiCert: '' };

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
