'use client';

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Header from '@/components/Header';
import SectionHeading from '@/components/SectionHeading';
import SharedCriteriaSection from '@/components/SharedCriteriaSection';
import JobCard from '@/components/JobCard';
import type { JobUIState } from '@/components/JobCard';
import ComparisonTable from '@/components/ComparisonTable';
import ErrorBoundary from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';
import { evaluate } from '@/lib/points';
import type { JobEvaluation } from '@/lib/points';
import type { JobAssessment, PlanningDates, SharedCriteria } from '@/lib/types';
import { defaultPlanningDates, defaultSharedCriteria, isYm, newJob } from '@/lib/types';
import { applyDates } from '@/lib/timeline';
import { mergeQueryString, persistState, readInitialState } from '@/lib/urlState';
import { MAX_JOBS } from '@/data/pointsCriteria';
import '@/app/i18n/client';

function PageSkeleton() {
  return (
    <div className="max-w-[780px] mx-auto px-[26px] pt-[34px]">
      <div className="h-4 w-28 mb-[72px]" style={{ backgroundColor: 'var(--hair)' }} />
      <div className="h-10 w-3/4 mb-[60px]" style={{ backgroundColor: 'var(--hair)' }} />
      <div className="grid gap-x-9 gap-y-[30px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(290px, 100%), 1fr))' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 mb-2.5" style={{ backgroundColor: 'var(--hair)' }} />
            <div className="h-11" style={{ backgroundColor: 'var(--hair)', opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_JOB_UI: JobUIState = { q: '', open: false };

interface JobCardSlotProps {
  jobId: string;
  job: JobAssessment;
  evaluation: JobEvaluation;
  canRemove: boolean;
  ui: JobUIState;
  openSelect: string | null;
  setOpenSelect: (key: string | null) => void;
  ausWorkLocked: boolean;
  overseasWorkLocked: boolean;
  collapsed: boolean;
  patchJob: (id: string, patch: Partial<JobAssessment>) => void;
  patchJobUI: (id: string, patch: Partial<JobUIState>) => void;
  removeJob: (id: string) => void;
  toggleJob: (id: string) => void;
}

// memo gate for the accordion cards: per-job closures are bound *below* the
// prop comparison, so a keystroke in one card no longer reconciles the rest
const JobCardSlot = memo(function JobCardSlot({
  jobId, job, evaluation, canRemove, ui, openSelect, setOpenSelect,
  ausWorkLocked, overseasWorkLocked, collapsed,
  patchJob, patchJobUI, removeJob, toggleJob,
}: JobCardSlotProps) {
  return (
    <JobCard
      job={job}
      evaluation={evaluation}
      canRemove={canRemove}
      ui={ui}
      onPatch={(patch) => patchJob(jobId, patch)}
      onUIPatch={(patch) => patchJobUI(jobId, patch)}
      onRemove={() => removeJob(jobId)}
      openSelect={openSelect}
      setOpenSelect={setOpenSelect}
      ausWorkLocked={ausWorkLocked}
      overseasWorkLocked={overseasWorkLocked}
      collapsed={collapsed}
      onToggleCollapse={() => toggleJob(jobId)}
    />
  );
});

const PageContent = () => {
  const { t, ready } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initial = useMemo(() => readInitialState(), []);
  const [shared, setShared] = useState<SharedCriteria>(initial.shared);
  const [jobs, setJobs] = useState<JobAssessment[]>(initial.jobs);
  const [dates, setDates] = useState<PlanningDates>(initial.dates);

  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [jobUI, setJobUI] = useState<Record<string, JobUIState>>({});
  // Accordion: the one assessment currently expanded for editing.
  // '__init' resolves to the first job at render time — capturing initial.jobs[0].id
  // here can mismatch under StrictMode double-invocation (ids are regenerated).
  const [openJobIdRaw, setOpenJobId] = useState<string | null>('__init');
  const openJobId = openJobIdRaw === '__init' ? (jobs[0]?.id ?? null) : openJobIdRaw;

  // today as YYYY-MM — PageContent only renders after the mounted gate, so this is client-safe
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Date-derived brackets, purely to feed the live points readout on each job card
  const derived = useMemo(() => applyDates(shared, jobs, dates, today), [shared, jobs, dates, today]);
  const evaluation = useMemo(() => evaluate(derived.shared, derived.jobs), [derived]);

  // Persist to localStorage + keep the URL shareable (debounced) — same
  // mechanism the points-tested page used before this data moved here.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const id = setTimeout(() => {
      persistState(shared, jobs, dates);
      const qs = mergeQueryString(window.location.search, shared, jobs, dates);
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    }, 250);
    return () => clearTimeout(id);
  }, [shared, jobs, dates]);

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const closeAll = () => {
      setOpenSelect(null);
      setJobUI((prev) => {
        if (!Object.values(prev).some((u) => u?.open)) return prev;
        const next: Record<string, JobUIState> = {};
        for (const [k, u] of Object.entries(prev)) next[k] = { ...u, open: false };
        return next;
      });
    };
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('[data-dd]')) closeAll();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const patchShared = useCallback((patch: Partial<SharedCriteria>) => {
    setShared((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchDates = useCallback((patch: Partial<PlanningDates>) => {
    setDates((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchJob = useCallback((id: string, patch: Partial<JobAssessment>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const patchJobUI = useCallback((id: string, patch: Partial<JobUIState>) => {
    setJobUI((prev) => {
      const current: JobUIState = prev[id] ?? { q: '', open: false };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (openJobId === id) setOpenJobId(null);
  }, [openJobId]);

  const toggleJob = useCallback((id: string) => {
    setOpenSelect(null);
    // Close this card's occupation search too, so the collapsing body
    // can clip cleanly (overflow flips to hidden mid-transition).
    patchJobUI(id, { open: false });
    setOpenJobId(openJobId === id ? null : id);
  }, [openJobId, patchJobUI]);

  const handleReset = useCallback(() => {
    const nj = newJob();
    setShared({ ...defaultSharedCriteria });
    setJobs([nj]);
    setJobUI({});
    setOpenJobId(nj.id);
    // Preserve visa491Grant — it's the Independent Migration page's field,
    // not this page's, so a Profile reset shouldn't clear it out from under it.
    setDates((prev) => ({ ...defaultPlanningDates, visa491Grant: prev.visa491Grant }));
  }, []);

  if (!ready || !mounted) return <PageSkeleton />;

  const anySearchOpen = Object.values(jobUI).some((u) => u?.open);
  const sec2Active = (openSelect !== null && !openSelect.startsWith('sh:')) || anySearchOpen;

  return (
    <div
      className="max-w-[780px] mx-auto"
      style={{
        paddingLeft: 'max(26px, env(safe-area-inset-left))',
        paddingRight: 'max(26px, env(safe-area-inset-right))',
      }}
    >
      <Header titleKey="profilePageTitle" subtitleKey="profilePageSubtitle" />

      <div>
        <SharedCriteriaSection
          shared={derived.shared}
          onPatch={patchShared}
          openSelect={openSelect}
          setOpenSelect={setOpenSelect}
          ageLocked={isYm(dates.birth)}
          dates={dates}
          onDatesPatch={patchDates}
          today={today}
        />

        {/* 02 — Skills assessments */}
        <section
          className="mt-[72px] relative"
          style={{ zIndex: sec2Active ? 30 : 'auto', animation: 'eoiFadeUp 0.7s ease 0.16s backwards' }}
        >
          <SectionHeading num="02" title={t('sections.jobs')} side="ASSESSMENTS" />
          <p className="mt-3.5 mb-0 text-[0.78125rem] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
            {t('jobsNote')}
          </p>

          {jobs.map((job, i) => (
            <JobCardSlot
              key={job.id}
              jobId={job.id}
              job={derived.jobs[i]}
              evaluation={evaluation.jobs[i]}
              canRemove={jobs.length > 1}
              ui={jobUI[job.id] ?? DEFAULT_JOB_UI}
              openSelect={openSelect}
              setOpenSelect={setOpenSelect}
              ausWorkLocked={isYm(jobs[i].ausWorkStart)}
              overseasWorkLocked={isYm(jobs[i].overseasWorkStart)}
              collapsed={openJobId !== job.id}
              patchJob={patchJob}
              patchJobUI={patchJobUI}
              removeJob={removeJob}
              toggleJob={toggleJob}
            />
          ))}

          <ComparisonTable evaluation={evaluation} />

          {jobs.length < MAX_JOBS && (
            <button
              type="button"
              onClick={() => {
                const nj = newJob();
                setJobs((prev) => [...prev, nj]);
                setOpenJobId(nj.id);
              }}
              className="w-full mt-[18px] p-[15px] cursor-pointer text-[0.78125rem] tracking-[0.14em] hover:bg-[var(--hover)] hover:border-[var(--ink)]"
              style={{
                background: 'none',
                border: '1px dashed var(--muted)',
                color: 'var(--ink-soft)',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
            >
              +&nbsp;&nbsp;{t('addJob')}
            </button>
          )}
        </section>

        <p className="mt-[58px] mb-0 text-[0.78125rem] leading-[1.7]" style={{ color: 'var(--muted)' }}>
          {t('profileSeeResults')}{' '}
          <Link href="/" className="underline underline-offset-4 hover:text-[var(--ink)]" style={{ color: 'var(--ink-soft)', textDecorationColor: 'var(--hair)' }}>
            {t('navIndependent')} →
          </Link>
          {' · '}
          <Link href="/sponsorship" className="underline underline-offset-4 hover:text-[var(--ink)]" style={{ color: 'var(--ink-soft)', textDecorationColor: 'var(--hair)' }}>
            {t('navSponsorship')} →
          </Link>
        </p>

        <button
          type="button"
          onClick={handleReset}
          className="mt-3.5 cursor-pointer text-xs tracking-[0.14em] px-0 py-1 underline underline-offset-4 hover:text-[var(--ink)]"
          style={{ background: 'none', color: 'var(--muted)', border: 'none', textDecorationColor: 'var(--hair)' }}
        >
          {t('profileReset')}
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default function ProfileClient() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen">
        <Suspense fallback={<PageSkeleton />}>
          <PageContent />
        </Suspense>
      </main>
    </ErrorBoundary>
  );
}
