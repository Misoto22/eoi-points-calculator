import type { Evaluation } from './points';
import { hasOccupation } from './points';
import type { SharedCriteria } from './types';
import { assessingAuthority } from '@/data/assessingAuthorities';
import type { VisaCode } from '@/data/pointsCriteria';
import {
  assessmentFeeByAuthority,
  assessmentFeeFallbackRange,
  englishTestFee,
  naatiCclFee,
  secondaryApplicantCharge,
  stateNominationFee,
  visaApplicationCharge,
} from '@/data/fees';

/** A single figure when the authority has a known fee, otherwise a typical range — never both. */
export type AssessmentFeeLine =
  | { jobTag: string; authority: string; fee: number; range: null }
  | { jobTag: string; authority: string; fee: null; range: [number, number] };

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

// A partner who is already an AU citizen/PR isn't a migrating secondary
// applicant, so they don't add a visa application charge — only a partner
// being included on the visa application (skills-assessed or English-only) does.
const PARTNER_STATUSES = new Set(['partnerSkills', 'partnerEnglish']);

/** [low, high] for a fee line — a known fee is a single-point range, an unknown one uses its fallback range. */
function assessmentRange(a: AssessmentFeeLine): [number, number] {
  return a.fee !== null ? [a.fee, a.fee] : a.range;
}

export function estimateFees(evaluation: Evaluation, shared: SharedCriteria): FeeEstimate {
  const best = evaluation.best;
  const visaCharge = best ? visaApplicationCharge[best.code] : null;
  const partnerCharge = PARTNER_STATUSES.has(shared.partnerStatus) ? secondaryApplicantCharge.partner : 0;

  const assessments: AssessmentFeeLine[] = evaluation.jobs
    .filter(hasOccupation)
    .map((je): AssessmentFeeLine => {
      const tag = String.fromCharCode(65 + je.index);
      const info = assessingAuthority(je.occupation.anzsco);
      const fee = assessmentFeeByAuthority[info.authority];
      return fee !== undefined
        ? { jobTag: tag, authority: info.authority, fee, range: null }
        : { jobTag: tag, authority: info.authority, fee: null, range: assessmentFeeFallbackRange };
    });

  const englishFee = shared.english ? englishTestFee : 0;
  const naatiFee = shared.communityLanguage ? naatiCclFee : 0;

  let nominationFeeRange: [number, number] | null = null;
  if (best && (best.code === '190' || best.code === '491')) {
    const pathway = best.job.pathways.find((p) => p.code === best.code);
    const fees = (pathway?.states ?? [])
      .map((s) => stateNominationFee[s])
      .filter((f): f is number => f !== null);
    if (fees.length > 0) nominationFeeRange = [Math.min(...fees), Math.max(...fees)];
  }

  const assessLow = assessments.reduce((sum, a) => sum + assessmentRange(a)[0], 0);
  const assessHigh = assessments.reduce((sum, a) => sum + assessmentRange(a)[1], 0);
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

export interface FeeLineItem {
  labelKey: string;
  labelParams?: Record<string, string | number>;
  amountLow: number;
  amountHigh: number;
  noteKey?: string;
}

/**
 * Every line contributing to `totalLow`/`totalHigh`, as one list. The card
 * (FeeEstimateSection) and the printable report (ReportView) both render
 * from this instead of each re-deriving their own row set, so the total they
 * show can never drift from the rows visible above it.
 */
export function feeLineItems(fee: FeeEstimate, bestVisa: VisaCode | undefined): FeeLineItem[] {
  const items: FeeLineItem[] = [];
  if (fee.visaCharge !== null && bestVisa) {
    items.push({ labelKey: 'feesVisaCharge', labelParams: { visa: bestVisa }, amountLow: fee.visaCharge, amountHigh: fee.visaCharge });
  }
  if (fee.partnerCharge > 0) {
    items.push({ labelKey: 'feesPartnerCharge', amountLow: fee.partnerCharge, amountHigh: fee.partnerCharge });
  }
  for (const a of fee.assessments) {
    const [amountLow, amountHigh] = assessmentRange(a);
    items.push({
      labelKey: 'feesAssessment',
      labelParams: { tag: a.jobTag, authority: a.authority },
      amountLow,
      amountHigh,
      noteKey: a.fee === null ? 'feesAssessmentRange' : undefined,
    });
  }
  if (fee.englishTestFee > 0) {
    items.push({ labelKey: 'feesEnglishTest', amountLow: fee.englishTestFee, amountHigh: fee.englishTestFee });
  }
  if (fee.naatiFee > 0) {
    items.push({ labelKey: 'feesNaati', amountLow: fee.naatiFee, amountHigh: fee.naatiFee });
  }
  if (fee.nominationFeeRange) {
    items.push({
      labelKey: 'feesNomination',
      amountLow: fee.nominationFeeRange[0],
      amountHigh: fee.nominationFeeRange[1],
      noteKey: fee.nominationFeeRange[0] === 0 ? 'feesNominationFree' : undefined,
    });
  }
  return items;
}
