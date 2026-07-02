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
  };
}
