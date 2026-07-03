import type { JobAssessment, PlanningDates, SharedCriteria } from './types';
import { defaultPlanningDates, defaultSharedCriteria, isYm, newJob } from './types';
import { MAX_JOBS } from '@/data/pointsCriteria';

// Compact URL params so shared links stay short:
//   ?a=25-32&e=ielts7&ed=bachelor&p=single&s=1&b=1995-03&jobs=261313:3-5:5-8:1:2026-06:|221111::3-5:0
const SHARED_PARAMS: Record<string, keyof SharedCriteria> = {
  a: 'age',
  e: 'english',
  ed: 'education',
  p: 'partnerStatus',
};
const FLAG_PARAMS: Record<string, keyof SharedCriteria> = {
  s: 'stem',
  as: 'ausStudy',
  rs: 'regionalStudy',
  cl: 'communityLanguage',
};
const DATE_PARAMS: Record<string, keyof PlanningDates> = { b: 'birth', et: 'englishTest', nc: 'naatiCert' };

const V2_SHARED_KEY = 'eoi-v2-shared';
const V2_JOBS_KEY = 'eoi-v2-jobs';
const V2_DATES_KEY = 'eoi-v2-dates';
const V1_FORM_KEY = 'eoi-form';

export interface AppState {
  shared: SharedCriteria;
  jobs: JobAssessment[];
  dates: PlanningDates;
}

/** Server-safe parser: the whole read path without touching window */
export function parseStateFromParams(params: URLSearchParams): AppState | null {
  if (params.size === 0) return null;

  const shared = { ...defaultSharedCriteria };
  const dates = { ...defaultPlanningDates };
  let hasAny = false;

  for (const [param, field] of Object.entries(SHARED_PARAMS)) {
    const v = params.get(param);
    if (v) {
      (shared[field] as string) = v;
      hasAny = true;
    }
  }
  for (const [param, field] of Object.entries(FLAG_PARAMS)) {
    if (params.get(param) === '1') {
      (shared[field] as boolean) = true;
      hasAny = true;
    }
  }
  for (const [param, field] of Object.entries(DATE_PARAMS)) {
    const v = params.get(param);
    if (v && isYm(v)) { dates[field] = v; hasAny = true; }
  }

  let jobs: JobAssessment[] = [];
  const js = params.get('jobs');
  if (js) {
    jobs = js.split('|').slice(0, MAX_JOBS).map((part) => {
      const seg = part.split(':');
      const job = newJob();
      job.anzsco = seg[0] || '';
      job.ausWork = seg[1] || '';
      job.overseasWork = seg[2] || '';
      job.professionalYear = seg[3] === '1';
      job.ausWorkStart = seg[4] && isYm(seg[4]) ? seg[4] : '';
      job.overseasWorkStart = seg[5] && isYm(seg[5]) ? seg[5] : '';
      job.assessmentDate = seg[6] && isYm(seg[6]) ? seg[6] : '';
      return job;
    });
    if (jobs.length) hasAny = true;
  }

  if (!hasAny) return null;
  return { shared, jobs: jobs.length ? jobs : [newJob()], dates };
}

export function readStateFromUrl(): AppState | null {
  if (typeof window === 'undefined') return null;
  return parseStateFromParams(new URLSearchParams(window.location.search));
}

/** State-owned query params; anything else (e.g. i18next's ?lng=) is preserved on rewrite */
const STATE_PARAM_KEYS = [
  ...Object.keys(SHARED_PARAMS),
  ...Object.keys(FLAG_PARAMS),
  ...Object.keys(DATE_PARAMS),
  'jobs',
];

/**
 * Rebuild the query string from app state while keeping foreign params intact.
 * Returns the query string without the leading '?', or '' when empty.
 */
export function mergeQueryString(
  currentSearch: string,
  shared: SharedCriteria,
  jobs: JobAssessment[],
  dates: PlanningDates = { ...defaultPlanningDates },
): string {
  const params = new URLSearchParams(currentSearch);
  for (const key of STATE_PARAM_KEYS) params.delete(key);
  const stateParams = new URLSearchParams(stateToQueryString(shared, jobs, dates));
  for (const [k, v] of stateParams) params.set(k, v);
  return params.toString();
}

export function stateToQueryString(
  shared: SharedCriteria,
  jobs: JobAssessment[],
  dates: PlanningDates = { ...defaultPlanningDates },
): string {
  const params = new URLSearchParams();
  for (const [param, field] of Object.entries(SHARED_PARAMS)) {
    const v = shared[field];
    if (v) params.set(param, v as string);
  }
  for (const [param, field] of Object.entries(FLAG_PARAMS)) {
    if (shared[field]) params.set(param, '1');
  }
  const js = jobs
    .filter((j) => j.anzsco || j.ausWork || j.overseasWork || j.professionalYear || j.ausWorkStart || j.overseasWorkStart || j.assessmentDate)
    .map((j) =>
      [j.anzsco, j.ausWork, j.overseasWork, j.professionalYear ? '1' : '0', j.ausWorkStart, j.overseasWorkStart, j.assessmentDate]
        .join(':')
        .replace(/:+$/, ''),
    )
    .join('|');
  if (js) params.set('jobs', js);
  for (const [param, field] of Object.entries(DATE_PARAMS)) {
    if (dates[field]) params.set(param, dates[field]);
  }
  return params.toString();
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function persistState(shared: SharedCriteria, jobs: JobAssessment[], dates: PlanningDates): void {
  try {
    localStorage.setItem(V2_SHARED_KEY, JSON.stringify(shared));
    localStorage.setItem(V2_JOBS_KEY, JSON.stringify(jobs));
    localStorage.setItem(V2_DATES_KEY, JSON.stringify(dates));
  } catch {
    // Ignore quota errors
  }
}

/** Priority: URL params → v2 storage → migrated v1 form → defaults */
export function readInitialState(): AppState {
  if (typeof window === 'undefined') {
    return { shared: { ...defaultSharedCriteria }, jobs: [newJob()], dates: { ...defaultPlanningDates } };
  }

  const fromUrl = readStateFromUrl();
  if (fromUrl) return fromUrl;

  const storedShared = lsGet<Partial<SharedCriteria>>(V2_SHARED_KEY);
  const storedJobs = lsGet<Partial<JobAssessment>[]>(V2_JOBS_KEY);
  if (storedShared || (storedJobs && storedJobs.length)) {
    const jobs = (storedJobs && storedJobs.length ? storedJobs : [{}])
      .slice(0, MAX_JOBS)
      .map((j) => ({ ...newJob(), ...j }));
    // Validate each stored date field; silently drop any that are not YYYY-MM
    const rawDates = lsGet<Record<string, string>>(V2_DATES_KEY);
    const dates: PlanningDates = { ...defaultPlanningDates };
    if (rawDates) {
      for (const [k, v] of Object.entries(rawDates)) {
        if (k in defaultPlanningDates && isYm(v)) {
          (dates as unknown as Record<string, string>)[k] = v;
        }
      }
    }
    return { shared: { ...defaultSharedCriteria, ...storedShared }, jobs, dates };
  }

  // v1 stored a single flat form — split into shared criteria + one assessment
  const v1 = lsGet<Record<string, string | boolean>>(V1_FORM_KEY);
  if (v1) {
    const shared: SharedCriteria = {
      ...defaultSharedCriteria,
      age: (v1.age as string) || '',
      english: (v1.english as string) || '',
      education: (v1.education as string) || '',
      partnerStatus: (v1.partnerStatus as string) || '',
      stem: !!v1.stem,
      ausStudy: !!v1.ausStudy,
      regionalStudy: !!v1.regionalStudy,
      communityLanguage: !!v1.communityLanguage,
    };
    const job = newJob();
    job.ausWork = (v1.ausWork as string) || '';
    job.overseasWork = (v1.overseasWork as string) || '';
    job.professionalYear = !!v1.professionalYear;
    return { shared, jobs: [job], dates: { ...defaultPlanningDates } };
  }

  return { shared: { ...defaultSharedCriteria }, jobs: [newJob()], dates: { ...defaultPlanningDates } };
}
