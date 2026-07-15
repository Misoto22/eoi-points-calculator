import type { JobAssessment, SharedCriteria } from './types';
import { monthsBetween } from './timeline';
import { isYm } from './types';
import { isCsolListed } from '@/data/csol';
import { ENS_AGE_LIMIT, EXPERIENCE_YEARS_REQUIRED } from '@/data/sponsorship';
import type { SponsorshipStreamCode } from '@/data/sponsorship';
import type { SponsorshipInputs } from './types';

/** ANZSCO major group is the code's first digit. Specialist Skills excludes 3 (Technicians/Trades), 7 (Machinery/Drivers), 8 (Labourers). */
const SPECIALIST_EXCLUDED_GROUPS = new Set(['3', '7', '8']);

export function isSpecialistEligibleGroup(anzsco: string): boolean {
  return anzsco !== '' && !SPECIALIST_EXCLUDED_GROUPS.has(anzsco[0]);
}

// Bracket → minimum years it represents, matching jobSelectCriteria's value set.
const AUS_WORK_MIN_YEARS: Record<string, number> = { '': 0, '1-3': 1, '3-5': 3, '5-8': 5, '8-10': 8 };
const OVERSEAS_WORK_MIN_YEARS: Record<string, number> = { '': 0, '3-5': 3, '5-8': 5, '8-10': 8 };

/**
 * Approximate total relevant work experience for the sponsorship checklist,
 * as the sum of each bracket's minimum years — a career's Australian and
 * overseas segments are normally sequential, not concurrent. This is a
 * heuristic reusing the points-test brackets (avoiding duplicate data entry),
 * not an authoritative count of "employment in the last 5 years" as the
 * actual visa criteria define it.
 */
export function estimateExperienceYears(job: JobAssessment): number {
  return (AUS_WORK_MIN_YEARS[job.ausWork] ?? 0) + (OVERSEAS_WORK_MIN_YEARS[job.overseasWork] ?? 0);
}

/**
 * Uncapped current age from a birth month — deliberately not routed through
 * the points-test's `shared.age` bracket, which maxes out at "40-44". Ages
 * 45+ are exactly the segment 189/190/491 can't help and this module can.
 */
export function ageYearsFromBirth(birth: string, today: string): number | null {
  if (!isYm(birth)) return null;
  return Math.floor(monthsBetween(birth, today) / 12);
}

/**
 * Whether the applicant is confirmed under the 186 age ceiling. Prefers the
 * exact birth month; when that's not entered, falls back to the points-test
 * age bracket — every selectable bracket (18-24…40-44) tops out below 45, so
 * a bracket alone already confirms "under 45" even without an exact age.
 * Null (unknown) only when neither is set.
 */
export function isUnderAgeLimit(ageYears: number | null, sharedAge: string): boolean | null {
  if (ageYears !== null) return ageYears < ENS_AGE_LIMIT;
  if (sharedAge !== '') return true;
  return null;
}

export interface SponsorshipGate {
  /** i18n key suffix under spGate* */
  key: string;
  ok: boolean;
  params?: Record<string, number>;
}

export interface SponsorshipStreamResult {
  code: SponsorshipStreamCode;
  eligible: boolean;
  gates: SponsorshipGate[];
}

export interface JobSponsorshipResult {
  job: JobAssessment;
  index: number;
  experienceYears: number;
  streams: SponsorshipStreamResult[];
}

export interface SponsorshipEvaluation {
  ageYears: number | null;
  /** See `isUnderAgeLimit` — true/false when known (birth or bracket), null when neither is entered. */
  ageUnder45: boolean | null;
  englishOk: boolean;
  jobs: JobSponsorshipResult[];
}

function allOk(gates: SponsorshipGate[]): boolean {
  return gates.every((g) => g.ok);
}

function evaluateJobStreams(
  job: JobAssessment,
  inputs: SponsorshipInputs,
  experienceYears: number,
  ageUnder45: boolean | null,
  englishOk: boolean,
): SponsorshipStreamResult[] {
  const hasOcc = job.anzsco !== '';
  const csolOk = hasOcc && isCsolListed(job.anzsco);
  const specialistGroupOk = hasOcc && isSpecialistEligibleGroup(job.anzsco);
  const underAgeLimit = ageUnder45 === true;
  // CSIT applies to ENS 186 nominations lodged on/after 7 Dec 2024, same
  // figure as the 482 Core Skills threshold — both 186 streams gate on it.
  const meetsCsit = inputs.salaryBand === 'csitToSsit' || inputs.salaryBand === 'ssitPlus';

  const core: SponsorshipGate[] = [
    { key: 'sponsor', ok: inputs.hasSponsor },
    { key: 'csol', ok: csolOk },
    { key: 'salaryCsit', ok: meetsCsit },
    { key: 'experience', ok: experienceYears >= EXPERIENCE_YEARS_REQUIRED['482core'], params: { years: EXPERIENCE_YEARS_REQUIRED['482core'] } },
    { key: 'english', ok: englishOk },
  ];

  const specialist: SponsorshipGate[] = [
    { key: 'sponsor', ok: inputs.hasSponsor },
    { key: 'specialistGroup', ok: specialistGroupOk },
    { key: 'salarySsit', ok: inputs.salaryBand === 'ssitPlus' },
    { key: 'experience', ok: experienceYears >= EXPERIENCE_YEARS_REQUIRED['482specialist'], params: { years: EXPERIENCE_YEARS_REQUIRED['482specialist'] } },
    { key: 'english', ok: englishOk },
  ];

  const direct: SponsorshipGate[] = [
    { key: 'sponsor', ok: inputs.hasSponsor },
    { key: 'csol', ok: csolOk },
    { key: 'salaryCsit', ok: meetsCsit },
    { key: 'experience', ok: experienceYears >= EXPERIENCE_YEARS_REQUIRED['186direct'], params: { years: EXPERIENCE_YEARS_REQUIRED['186direct'] } },
    { key: 'ageLimit', ok: underAgeLimit, params: { age: ENS_AGE_LIMIT } },
    { key: 'english', ok: englishOk },
  ];

  const trt: SponsorshipGate[] = [
    { key: 'trtEligible', ok: inputs.trtEligible },
    { key: 'salaryCsit', ok: meetsCsit },
    { key: 'ageLimit', ok: underAgeLimit, params: { age: ENS_AGE_LIMIT } },
    { key: 'english', ok: englishOk },
  ];

  return [
    { code: '482core', eligible: allOk(core), gates: core },
    { code: '482specialist', eligible: allOk(specialist), gates: specialist },
    { code: '186direct', eligible: allOk(direct), gates: direct },
    { code: '186trt', eligible: allOk(trt), gates: trt },
  ];
}

/**
 * Employer-sponsorship checklist (482/186) — a separate, non-points-tested
 * eligibility model from `evaluate()` in points.ts. Reuses the existing job
 * list (occupation + work-experience brackets) rather than a dedicated
 * occupation picker, so it only covers occupations already selectable in the
 * points-tested calculator (occupations.ts' MLTSSL/STSOL/ROL set) — some
 * CSOL-only occupations outside that set aren't checkable here.
 */
export function evaluateSponsorship(
  jobs: JobAssessment[],
  shared: SharedCriteria,
  inputs: SponsorshipInputs,
  birth: string,
  today: string,
): SponsorshipEvaluation {
  const ageYears = ageYearsFromBirth(birth, today);
  const ageUnder45 = isUnderAgeLimit(ageYears, shared.age);
  // Both 482 (IELTS 5) and 186 (Competent/IELTS 6) requirements sit at or
  // below the app's lowest recorded bracket, so any selected value clears both.
  const englishOk = shared.english !== '';

  const jobResults: JobSponsorshipResult[] = jobs.map((job, index) => {
    const experienceYears = estimateExperienceYears(job);
    return {
      job,
      index,
      experienceYears,
      streams: evaluateJobStreams(job, inputs, experienceYears, ageUnder45, englishOk),
    };
  });

  return { ageYears, ageUnder45, englishOk, jobs: jobResults };
}

/** i18n key per gate — shared so every surface labels the same requirement the same way. */
export const GATE_LABEL_KEY: Record<string, string> = {
  sponsor: 'spGateSponsor',
  csol: 'spGateCsol',
  salaryCsit: 'spGateSalaryCsit',
  salarySsit: 'spGateSalarySsit',
  specialistGroup: 'spGateSpecialistGroup',
  experience: 'spGateExperience',
  ageLimit: 'spGateAgeLimit',
  english: 'spGateEnglish',
  trtEligible: 'spGateTrtEligible',
};

/** i18n key per stream. */
export const STREAM_LABEL_KEY: Record<SponsorshipStreamCode, string> = {
  '482core': 'spStream482Core',
  '482specialist': 'spStream482Specialist',
  '186direct': 'spStream186Direct',
  '186trt': 'spStream186Trt',
};
