import type { Evaluation } from './points';
import type { SharedCriteria } from './types';
import { assessingAuthority } from '@/data/assessingAuthorities';
import {
  assessmentFeeByAuthority,
  assessmentFeeFallbackRange,
  englishTestFee,
  naatiCclFee,
  secondaryApplicantCharge,
  stateNominationFee,
  visaApplicationCharge,
} from '@/data/fees';

export interface AssessmentFeeLine {
  jobTag: string;
  authority: string;
  /** A single figure when the authority has a known fee, otherwise null (see `range`) */
  fee: number | null;
  range: [number, number] | null;
}

export interface FeeEstimate {
  visaCharge: number | null;
  partnerCharge: number;
  assessments: AssessmentFeeLine[];
  englishTestFee: number;
  naatiFee: number;
  /** [min, max] state nomination fee across the states eligible for the best pathway's occupation; null if not applicable */
  nominationFeeRange: [number, number] | null;
  totalLow: number;
  totalHigh: number;
}

const PARTNER_STATUSES = new Set(['partnerSkills', 'partnerCitizen', 'partnerEnglish']);

export function estimateFees(evaluation: Evaluation, shared: SharedCriteria): FeeEstimate {
  const best = evaluation.best;
  const visaCharge = best ? visaApplicationCharge[best.code] : null;
  const partnerCharge = PARTNER_STATUSES.has(shared.partnerStatus) ? secondaryApplicantCharge.partner : 0;

  const assessments: AssessmentFeeLine[] = evaluation.jobs
    .filter((je) => je.occupation)
    .map((je) => {
      const tag = String.fromCharCode(65 + je.index);
      const info = assessingAuthority(je.occupation!.anzsco);
      const fee = assessmentFeeByAuthority[info.authority] ?? null;
      return { jobTag: tag, authority: info.authority, fee, range: fee === null ? assessmentFeeFallbackRange : null };
    });

  const englishFee = shared.english ? englishTestFee.ielts : 0;
  const naatiFee = shared.communityLanguage ? naatiCclFee : 0;

  let nominationFeeRange: [number, number] | null = null;
  if (best && (best.code === '190' || best.code === '491')) {
    const pathway = best.job.pathways.find((p) => p.code === best.code);
    const fees = (pathway?.states ?? [])
      .map((s) => stateNominationFee[s])
      .filter((f): f is number => f !== null);
    if (fees.length > 0) nominationFeeRange = [Math.min(...fees), Math.max(...fees)];
  }

  const assessLow = assessments.reduce((sum, a) => sum + (a.fee ?? a.range![0]), 0);
  const assessHigh = assessments.reduce((sum, a) => sum + (a.fee ?? a.range![1]), 0);
  const fixed = (visaCharge ?? 0) + partnerCharge + englishFee + naatiFee;

  return {
    visaCharge,
    partnerCharge,
    assessments,
    englishTestFee: englishFee,
    naatiFee,
    nominationFeeRange,
    totalLow: fixed + assessLow + (nominationFeeRange?.[0] ?? 0),
    totalHigh: fixed + assessHigh + (nominationFeeRange?.[1] ?? 0),
  };
}
