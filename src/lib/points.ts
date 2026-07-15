import type { JobAssessment, SharedCriteria } from './types';
import type { Occupation } from '@/data/occupations';
import { occupations } from '@/data/occupations';
import {
  EMPLOYMENT_EXPERIENCE_CAP,
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
  /** Highest base score across jobs — the "裸分" before any state/regional nomination bonus */
  bareScore: number;
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

// O(1) lookup — evaluate() and the month-by-month timeline scan resolve
// occupations repeatedly, so a linear .find over 500+ rows adds up
const occupationByAnzsco = new Map(occupations.map((o) => [o.anzsco, o]));

export function findOccupation(anzsco: string): Occupation | null {
  if (!anzsco) return null;
  return occupationByAnzsco.get(anzsco) ?? null;
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
    // Part 6D.5 item 6D51: combined AU + overseas employment points cap at 20
    const employment = Math.min(points.ausWork + points.overseasWork, EMPLOYMENT_EXPERIENCE_CAP);
    const base = sharedTotal + employment + points.professionalYear;
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

  // Bare score (裸分): the highest base across jobs, before any nomination bonus.
  const bareScore = jobEvaluations.reduce((max, je) => Math.max(max, je.base), 0);
  const bestTotal = best ? best.total : bareScore;

  return { shared: sharedPoints, sharedTotal, jobs: jobEvaluations, best, bestTotal, bareScore };
}

/** Narrows `occupation` from nullable to present — lets `.filter(hasOccupation).map(...)` read `je.occupation` without a `!` assertion. */
export function hasOccupation(je: JobEvaluation): je is JobEvaluation & { occupation: Occupation } {
  return je.occupation !== null;
}

/** The highest-scoring eligible pathway for a single assessment, or null if none is eligible. */
export function bestPathwayForJob(je: JobEvaluation): PathwayResult | null {
  let best: PathwayResult | null = null;
  for (const p of je.pathways) {
    if (p.eligible && (!best || p.total > best.total)) best = p;
  }
  return best;
}

export type PathwayStatus = 'noOcc' | 'listNo' | 'noState' | 'low' | 'ok';

/**
 * Why a pathway is or isn't eligible, in the same precedence every ineligibility
 * display in the app should follow: no occupation picked, then the federal
 * list gate, then the per-state list gate (190/491 only), then the points
 * floor. Shared by ResultsBand (live UI) and ReportView (export) so the two
 * never drift into showing different reasons for the same pathway.
 */
export function pathwayStatus(p: PathwayResult): PathwayStatus {
  if (!p.hasOccupation) return 'noOcc';
  if (!p.listOk) return 'listNo';
  if (p.code !== '189' && p.states.length === 0) return 'noState';
  if (p.total < MIN_POINTS) return 'low';
  return 'ok';
}

/** i18n key per `pathwayStatus()` result — shared so every surface labels the same reason the same way. */
export const PATHWAY_STATUS_LABEL_KEY: Record<PathwayStatus, string> = {
  noOcc: 'pathNoOcc',
  listNo: 'pathListNo',
  noState: 'pathNoState',
  low: 'pathLow',
  ok: 'pathOk',
};
