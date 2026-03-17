export interface FormData {
  age: string;
  english: string;
  ausWork: string;
  overseasWork: string;
  education: string;
  stem: boolean;
  ausStudy: boolean;
  communityLanguage: boolean;
  partnerStatus: string;
  professionalYear: boolean;
  stateNomination: boolean;
  regionalNomination: boolean;
  regionalStudy: boolean;
}

export interface PointsBreakdown {
  age: number;
  english: number;
  ausWork: number;
  overseasWork: number;
  education: number;
  stem: number;
  ausStudy: number;
  communityLanguage: number;
  professionalYear: number;
  stateNomination: number;
  regionalNomination: number;
  regionalStudy: number;
  partnerStatus: number;
  total: number;
}

export const defaultFormData: FormData = {
  age: '',
  english: '',
  ausWork: '',
  overseasWork: '',
  education: '',
  stem: false,
  ausStudy: false,
  communityLanguage: false,
  partnerStatus: '',
  professionalYear: false,
  stateNomination: false,
  regionalNomination: false,
  regionalStudy: false,
};
