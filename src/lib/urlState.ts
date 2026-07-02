import type { JobAssessment, SharedCriteria } from './types';
import { defaultSharedCriteria, newJob } from './types';
import { MAX_JOBS } from '@/data/pointsCriteria';

// Compact URL params so shared links stay short:
//   ?a=25-32&e=ielts7&ed=bachelor&p=single&s=1&jobs=261313:3-5:5-8:1|221111::3-5:0
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

export interface AppState {
  shared: SharedCriteria;
  jobs: JobAssessment[];
}

export function readStateFromUrl(): AppState | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.size === 0) return null;

  const shared = { ...defaultSharedCriteria };
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
      return job;
    });
    if (jobs.length) hasAny = true;
  }

  if (!hasAny) return null;
  return { shared, jobs: jobs.length ? jobs : [newJob()] };
}

export function stateToQueryString(shared: SharedCriteria, jobs: JobAssessment[]): string {
  const params = new URLSearchParams();
  for (const [param, field] of Object.entries(SHARED_PARAMS)) {
    const v = shared[field];
    if (v) params.set(param, v as string);
  }
  for (const [param, field] of Object.entries(FLAG_PARAMS)) {
    if (shared[field]) params.set(param, '1');
  }
  const js = jobs
    .filter((j) => j.anzsco || j.ausWork || j.overseasWork || j.professionalYear)
    .map((j) => [j.anzsco, j.ausWork, j.overseasWork, j.professionalYear ? '1' : '0'].join(':'))
    .join('|');
  if (js) params.set('jobs', js);
  return params.toString();
}

const V2_SHARED_KEY = 'eoi-v2-shared';
const V2_JOBS_KEY = 'eoi-v2-jobs';
const V1_FORM_KEY = 'eoi-form';

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function persistState(shared: SharedCriteria, jobs: JobAssessment[]): void {
  try {
    localStorage.setItem(V2_SHARED_KEY, JSON.stringify(shared));
    localStorage.setItem(V2_JOBS_KEY, JSON.stringify(jobs));
  } catch {
    // Ignore quota errors
  }
}

/** Priority: URL params → v2 storage → migrated v1 form → defaults */
export function readInitialState(): AppState {
  if (typeof window === 'undefined') {
    return { shared: { ...defaultSharedCriteria }, jobs: [newJob()] };
  }

  const fromUrl = readStateFromUrl();
  if (fromUrl) return fromUrl;

  const storedShared = lsGet<Partial<SharedCriteria>>(V2_SHARED_KEY);
  const storedJobs = lsGet<Partial<JobAssessment>[]>(V2_JOBS_KEY);
  if (storedShared || (storedJobs && storedJobs.length)) {
    const jobs = (storedJobs && storedJobs.length ? storedJobs : [{}])
      .slice(0, MAX_JOBS)
      .map((j) => ({ ...newJob(), ...j }));
    return { shared: { ...defaultSharedCriteria, ...storedShared }, jobs };
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
    return { shared, jobs: [job] };
  }

  return { shared: { ...defaultSharedCriteria }, jobs: [newJob()] };
}
