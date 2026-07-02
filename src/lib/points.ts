import type { JobAssessment, SharedCriteria } from './types';
import type { Occupation } from '@/data/occupations';
import { occupations } from '@/data/occupations';
import {
  MIN_POINTS,
  jobSelectCriteria,
  optionPoints,
  pathways,
  professionalYearPoints,
  sharedBonusCriteria,
  sharedSelectCriteria,
} from '@/data/pointsCriteria';
import type { VisaCode } from '@/data/pointsCriteria';
import type { StateCode } from '@/data/stateLists';
import { statesListing } from '@/data/stateLists';

export interface SharedPoints {
  age: number;
  english: number;
  education: number;
  partnerStatus: number;
  stem: number;
  ausStudy: number;
  regionalStudy: number;
  communityLanguage: number;
}

export interface JobPoints {
  ausWork: number;
  overseasWork: number;
  professionalYear: number;
}

export interface PathwayResult {
  code: VisaCode;
  bonus: number;
  total: number;
  hasOccupation: boolean;
  /** Federal MLTSSL / STSOL / ROL gate */
  listOk: boolean;
  /** States whose own 190/491 list includes the occupation; empty for 189 */
  states: StateCode[];
  eligible: boolean;
}

export interface JobEvaluation {
  job: JobAssessment;
  index: number;
  points: JobPoints;
  /** Shared subtotal + job-specific points, before any nomination bonus */
  base: number;
  occupation: Occupation | null;
  pathways: PathwayResult[];
}

export interface Evaluation {
  shared: SharedPoints;
  sharedTotal: number;
  jobs: JobEvaluation[];
  best: { total: number; code: VisaCode; job: JobEvaluation } | null;
  /** Best eligible pathway total, or highest base when nothing is eligible yet */
  bestTotal: number;
}

export function calculateSharedPoints(shared: SharedCriteria): SharedPoints {
  return {
    age: optionPoints(sharedSelectCriteria.age, shared.age),
    english: optionPoints(sharedSelectCriteria.english, shared.english),
    education: optionPoints(sharedSelectCriteria.education, shared.education),
    partnerStatus: optionPoints(sharedSelectCriteria.partnerStatus, shared.partnerStatus),
    stem: shared.stem ? sharedBonusCriteria.stem : 0,
    ausStudy: shared.ausStudy ? sharedBonusCriteria.ausStudy : 0,
    regionalStudy: shared.regionalStudy ? sharedBonusCriteria.regionalStudy : 0,
    communityLanguage: shared.communityLanguage ? sharedBonusCriteria.communityLanguage : 0,
  };
}

export function calculateJobPoints(job: JobAssessment): JobPoints {
  return {
    ausWork: optionPoints(jobSelectCriteria.ausWork, job.ausWork),
    overseasWork: optionPoints(jobSelectCriteria.overseasWork, job.overseasWork),
    professionalYear: job.professionalYear ? professionalYearPoints : 0,
  };
}

export function findOccupation(anzsco: string): Occupation | null {
  if (!anzsco) return null;
  return occupations.find((o) => o.anzsco === anzsco) ?? null;
}

/**
 * Evaluate every skills assessment against every visa pathway.
 * 189 is gated by the federal MLTSSL list; 190/491 additionally require at
 * least one state/territory whose own list includes the occupation.
 */
export function evaluate(shared: SharedCriteria, jobs: JobAssessment[]): Evaluation {
  const sharedPoints = calculateSharedPoints(shared);
  const sharedTotal = Object.values(sharedPoints).reduce((sum, v) => sum + v, 0);

  const jobEvaluations: JobEvaluation[] = jobs.map((job, index) => {
    const points = calculateJobPoints(job);
    const base = sharedTotal + points.ausWork + points.overseasWork + points.professionalYear;
    const occupation = findOccupation(job.anzsco);

    const pathwayResults: PathwayResult[] = pathways.map((p) => {
      const total = base + p.bonus;
      const listOk = occupation ? p.lists.includes(occupation.list) : false;
      const states = p.perState && occupation && listOk && (p.code === '190' || p.code === '491')
        ? statesListing(occupation.anzsco, p.code)
        : [];
      const stateOk = !p.perState || states.length > 0;
      const eligible = !!occupation && listOk && stateOk && total >= MIN_POINTS;
      return { code: p.code, bonus: p.bonus, total, hasOccupation: !!occupation, listOk, states, eligible };
    });

    return { job, index, points, base, occupation, pathways: pathwayResults };
  });

  let best: Evaluation['best'] = null;
  for (const je of jobEvaluations) {
    for (const p of je.pathways) {
      if (p.eligible && (!best || p.total > best.total)) {
        best = { total: p.total, code: p.code, job: je };
      }
    }
  }

  const bestTotal = best
    ? best.total
    : jobEvaluations.reduce((max, je) => Math.max(max, je.base), 0);

  return { shared: sharedPoints, sharedTotal, jobs: jobEvaluations, best, bestTotal };
}
