'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import SectionHeading from '@/components/SectionHeading';
import SharedCriteriaSection from '@/components/SharedCriteriaSection';
import JobCard from '@/components/JobCard';
import type { JobUIState } from '@/components/JobCard';
import ResultsBand from '@/components/ResultsBand';
import ReferenceSection from '@/components/ReferenceSection';
import TimelineSection from '@/components/TimelineSection';
import ExportModal from '@/components/ExportModal';
import FloatingChip from '@/components/FloatingChip';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { evaluate } from '@/lib/points';
import type { JobAssessment, PlanningDates, SharedCriteria } from '@/lib/types';
import { defaultPlanningDates, defaultSharedCriteria, isYm, newJob } from '@/lib/types';
import { applyDates, buildTimeline } from '@/lib/timeline';
import { mergeQueryString, persistState, readInitialState } from '@/lib/urlState';
import { GOAL_RANGE, MAX_JOBS } from '@/data/pointsCriteria';
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

const PageContent = () => {
  const { t, ready } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initial = useMemo(() => readInitialState(), []);
  const [shared, setShared] = useState<SharedCriteria>(initial.shared);
  const [jobs, setJobs] = useState<JobAssessment[]>(initial.jobs);
  // dates wired to UI in Task 4; initialised here for URL/storage round-trip
  const [dates, setDates] = useState<PlanningDates>(initial.dates);
  const [goalPoints, setGoalPoints] = useLocalStorage<number>('eoi-goal', GOAL_RANGE.min);

  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [jobUI, setJobUI] = useState<Record<string, JobUIState>>({});
  // Accordion: the one assessment currently expanded for editing.
  // '__init' resolves to the first job at render time — capturing initial.jobs[0].id
  // here can mismatch under StrictMode double-invocation (ids are regenerated).
  const [openJobIdRaw, setOpenJobId] = useState<string | null>('__init');
  const openJobId = openJobIdRaw === '__init' ? (jobs[0]?.id ?? null) : openJobIdRaw;
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chipShown, setChipShown] = useState(false);
  const bandRef = useRef<HTMLDivElement | null>(null);

  // today as YYYY-MM — PageContent only renders after the mounted gate, so this is client-safe
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // evaluation now uses date-derived brackets
  const derived = useMemo(() => applyDates(shared, jobs, dates, today), [shared, jobs, dates, today]);
  const evaluation = useMemo(() => evaluate(derived.shared, derived.jobs), [derived]);
  const timeline = useMemo(() => buildTimeline({ shared, jobs, dates, today }), [shared, jobs, dates, today]);
  // Headline number is the bare score (裸分) — before any state/regional nomination bonus.
  const bareScore = evaluation.bareScore;
  const displayTotal = useAnimatedNumber(bareScore);

  // Persist to localStorage + keep the URL shareable (debounced)
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
      if (e.key === 'Escape') {
        setExportOpen((open) => {
          if (!open) closeAll();
          return false;
        });
      }
    };
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Floating chip appears once the results band scrolls out of view
  useEffect(() => {
    const el = bandRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => setChipShown(!entries[0].isIntersecting),
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready, mounted]);

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

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, []);

  const handleReset = useCallback(() => {
    const nj = newJob();
    setShared({ ...defaultSharedCriteria });
    setJobs([nj]);
    setJobUI({});
    setOpenJobId(nj.id);
    setDates({ ...defaultPlanningDates });
    setGoalPoints(GOAL_RANGE.min);
  }, [setGoalPoints]);

  const scrollToResults = useCallback(() => {
    const el = bandRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 32, behavior: 'smooth' });
  }, []);

  if (!ready || !mounted) return <PageSkeleton />;

  const anySearchOpen = Object.values(jobUI).some((u) => u?.open);
  const chipVisible = chipShown && bareScore > 0 && !exportOpen && !openSelect && !anySearchOpen;
  const sec2Active = (openSelect !== null && !openSelect.startsWith('sh:')) || anySearchOpen;

  return (
    <div className="max-w-[780px] wide:max-w-[1280px] mx-auto px-[26px]">
      <Header />

      {/* ≥wide: inputs flow in the left column, the results band sits sticky on the right.
          Below the breakpoint the grid collapses and DOM order (01·02·03·04) is the layout. */}
      {/* No items-start here: the right grid item must stretch to the full row
          height or the sticky panel has no room to travel. */}
      <div className="wide:grid wide:grid-cols-[minmax(0,1fr)_400px] wide:gap-x-16">
        <div className="min-w-0">
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
        <p className="mt-3.5 mb-0 text-[12.5px] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
          {t('jobsNote')}
        </p>

        {jobs.map((job, i) => (
          <JobCard
            key={job.id}
            job={derived.jobs[i]}
            evaluation={evaluation.jobs[i]}
            canRemove={jobs.length > 1}
            ui={jobUI[job.id] ?? { q: '', open: false }}
            onPatch={(patch) => patchJob(job.id, patch)}
            onUIPatch={(patch) => patchJobUI(job.id, patch)}
            onRemove={() => {
              setJobs((prev) => prev.filter((j) => j.id !== job.id));
              if (openJobId === job.id) setOpenJobId(null);
            }}
            openSelect={openSelect}
            setOpenSelect={setOpenSelect}
            ausWorkLocked={isYm(jobs[i].ausWorkStart)}
            overseasWorkLocked={isYm(jobs[i].overseasWorkStart)}
            collapsed={openJobId !== job.id}
            onToggleCollapse={() => {
              setOpenSelect(null);
              setOpenJobId(openJobId === job.id ? null : job.id);
            }}
          />
        ))}

            {jobs.length < MAX_JOBS && (
              <button
                type="button"
                onClick={() => {
                  const nj = newJob();
                  setJobs((prev) => [...prev, nj]);
                  setOpenJobId(nj.id);
                }}
                className="w-full mt-[18px] p-[15px] cursor-pointer text-[12.5px] tracking-[0.14em] hover:bg-[var(--hover)] hover:border-[var(--ink)]"
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
        </div>

        {/* One compact results band everywhere: in document order on narrow
            screens, a sticky right panel on wide ones. */}
        <div className="min-w-0 wide:col-start-2 wide:row-start-1 wide:row-span-2">
          <div className="wide:sticky wide:top-5">
            <ResultsBand
              evaluation={evaluation}
              shared={shared}
              goal={goalPoints}
              displayTotal={displayTotal}
              onGoalDec={() => setGoalPoints((prev: number) => Math.max(GOAL_RANGE.min, prev - GOAL_RANGE.step))}
              onGoalInc={() => setGoalPoints((prev: number) => Math.min(GOAL_RANGE.max, prev + GOAL_RANGE.step))}
              onOpenExport={() => setExportOpen(true)}
              onCopyLink={handleCopyLink}
              copied={copied}
              onReset={handleReset}
              bandRef={bandRef}
            />
          </div>
        </div>

        <div className="min-w-0 wide:col-start-1 wide:row-start-2">
          <TimelineSection
            dates={dates}
            jobs={jobs}
            timeline={timeline}
            goal={goalPoints}
            today={today}
          />
        </div>
      </div>

      <ReferenceSection totalPoints={bareScore} evaluation={evaluation} />

      {/* Footer */}
      <footer
        className="mt-[84px] pt-[26px] pb-12 flex flex-col gap-5"
        style={{ borderTop: '1px solid var(--hair)' }}
      >
        <p className="m-0 text-xs leading-[1.8] max-w-[56em]" style={{ color: 'var(--muted)' }}>
          {t('disclaimer')}
        </p>
        <div className="flex justify-between items-baseline gap-3 flex-wrap text-xs" style={{ color: 'var(--muted)' }}>
          <span>© 2026 Henry Chen</span>
          <div className="flex gap-5">
            {[
              { href: 'https://github.com/Misoto22/eoi-points-calculator', label: 'GitHub' },
              { href: 'https://www.linkedin.com/in/henry-misoto22/', label: 'LinkedIn' },
              { href: 'https://www.misoto22.com/', label: 'Website' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-[var(--ink)]"
                style={{ color: 'var(--muted)', textDecorationColor: 'var(--hair)' }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <FloatingChip visible={chipVisible} total={bareScore} onClick={scrollToResults} />

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        evaluation={evaluation}
        goal={goalPoints}
      />
    </div>
  );
};

export default function HomeClient() {
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
