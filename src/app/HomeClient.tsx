'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Header from '@/components/Header';
import ResultsBand from '@/components/ResultsBand';
import ReferenceSection from '@/components/ReferenceSection';
import Pr191Section from '@/components/Pr191Section';
import FeeEstimateSection from '@/components/FeeEstimateSection';
import TimelineSection from '@/components/TimelineSection';
import ExportModal from '@/components/ExportModal';
import FloatingChip from '@/components/FloatingChip';
import InstallPrompt from '@/components/InstallPrompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { evaluate } from '@/lib/points';
import type { PlanningDates } from '@/lib/types';
import { defaultPlanningDates } from '@/lib/types';
import { applyDates, buildTimeline } from '@/lib/timeline';
import { mergeQueryString, persistDates, readInitialState } from '@/lib/urlState';
import { GOAL_RANGE } from '@/data/pointsCriteria';
import '@/app/i18n/client';

function PageSkeleton() {
  return (
    <div className="max-w-[780px] mx-auto px-[26px] pt-[34px]">
      <div className="h-4 w-28 mb-[72px]" style={{ backgroundColor: 'var(--hair)' }} />
      <div className="h-10 w-3/4 mb-[60px]" style={{ backgroundColor: 'var(--hair)' }} />
      <div className="h-40" style={{ backgroundColor: 'var(--hair)', opacity: 0.5 }} />
    </div>
  );
}

const PageContent = () => {
  const { ready, t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // shared/jobs are read-only here — they belong to the Profile page.
  // This page only ever mutates `dates.visa491Grant` (the PR-pathway grant
  // month) and its own `goalPoints`.
  const initial = useMemo(() => readInitialState(), []);
  const shared = initial.shared;
  const jobs = initial.jobs;
  const [dates, setDates] = useState<PlanningDates>(initial.dates);
  const [goalPoints, setGoalPoints] = useLocalStorage<number>('eoi-goal', GOAL_RANGE.min);

  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chipShown, setChipShown] = useState(false);
  const bandRef = useRef<HTMLDivElement | null>(null);

  // today as YYYY-MM — PageContent only renders after the mounted gate, so this is client-safe
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // evaluation uses date-derived brackets
  const derived = useMemo(() => applyDates(shared, jobs, dates, today), [shared, jobs, dates, today]);
  const evaluation = useMemo(() => evaluate(derived.shared, derived.jobs), [derived]);
  const timeline = useMemo(() => buildTimeline({ shared, jobs, dates, today }), [shared, jobs, dates, today]);
  // Headline number is the bare score (裸分) — before any state/regional nomination bonus.
  const bareScore = evaluation.bareScore;
  const displayTotal = useAnimatedNumber(bareScore);

  // Persist the one field this page can edit, and keep the URL shareable
  // (debounced) — the full state (shared+jobs+dates) still round-trips
  // through the query string so "copy link" reproduces the whole result.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const id = setTimeout(() => {
      persistDates(dates);
      const qs = mergeQueryString(window.location.search, shared, jobs, dates);
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    }, 250);
    return () => clearTimeout(id);
  }, [shared, jobs, dates]);

  // Close the export modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExportOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
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

  const patchDates = useCallback((patch: Partial<PlanningDates>) => {
    setDates((prev) => ({ ...prev, ...patch }));
  }, []);

  const goalDec = useCallback(() => {
    setGoalPoints((prev: number) => Math.max(GOAL_RANGE.min, prev - GOAL_RANGE.step));
  }, [setGoalPoints]);

  const goalInc = useCallback(() => {
    setGoalPoints((prev: number) => Math.min(GOAL_RANGE.max, prev + GOAL_RANGE.step));
  }, [setGoalPoints]);

  const openExport = useCallback(() => setExportOpen(true), []);
  const closeExport = useCallback(() => setExportOpen(false), []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch { /* clipboard unavailable */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, []);

  const handleReset = useCallback(() => {
    setDates({ ...defaultPlanningDates });
    setGoalPoints(GOAL_RANGE.min);
  }, [setGoalPoints]);

  const scrollToResults = useCallback(() => {
    const el = bandRef.current;
    if (!el) return;
    // Standalone mode scrolls the body, not the window (see globals.css)
    const bodyScrolls = document.documentElement.classList.contains('standalone');
    const currentTop = bodyScrolls ? document.body.scrollTop : window.scrollY;
    const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const target = { top: el.getBoundingClientRect().top + currentTop - 32, behavior };
    if (bodyScrolls) document.body.scrollTo(target);
    else window.scrollTo(target);
  }, []);

  if (!ready || !mounted) return <PageSkeleton />;

  const chipVisible = chipShown && bareScore > 0 && !exportOpen;
  const hasProfile = jobs.some((j) => j.anzsco !== '');

  return (
    <div
      className="max-w-[780px] mx-auto"
      // Landscape on notched phones: keep content clear of the sensor housing
      style={{
        paddingLeft: 'max(26px, env(safe-area-inset-left))',
        paddingRight: 'max(26px, env(safe-area-inset-right))',
      }}
    >
      <Header />

      {!hasProfile && (
        <p className="mt-[26px] mb-0 text-[0.78125rem] leading-[1.7]" style={{ color: 'var(--muted)' }}>
          {t('homeNoProfile')}{' '}
          <Link href="/profile" className="underline underline-offset-4 hover:text-[var(--ink)]" style={{ color: 'var(--ink-soft)', textDecorationColor: 'var(--hair)' }}>
            {t('navProfile')} →
          </Link>
        </p>
      )}

      {/* The score card leads — it's the answer this page exists to give.
          Capped narrower than the page column so it reads as a compact
          card, not a full-width slab; it never needed the 2-column sticky
          layout the old single page used when a much taller "shared
          criteria + jobs" column sat next to it. */}
      <div className="max-w-[480px] mt-[26px]">
        <ResultsBand
          evaluation={evaluation}
          shared={shared}
          goal={goalPoints}
          displayTotal={displayTotal}
          onGoalDec={goalDec}
          onGoalInc={goalInc}
          onOpenExport={openExport}
          onCopyLink={handleCopyLink}
          copied={copied}
          onReset={handleReset}
          bandRef={bandRef}
        />
      </div>

      <TimelineSection
        dates={dates}
        jobs={jobs}
        timeline={timeline}
        goal={goalPoints}
        today={today}
      />

      <ReferenceSection evaluation={evaluation} />
      <FeeEstimateSection evaluation={evaluation} shared={shared} />
      <Pr191Section dates={dates} onDatesPatch={patchDates} today={today} />

      <Footer />

      <FloatingChip visible={chipVisible} total={bareScore} onClick={scrollToResults} />
      <InstallPrompt />

      <ExportModal
        open={exportOpen}
        onClose={closeExport}
        evaluation={evaluation}
        goal={goalPoints}
        shared={derived.shared}
        jobs={derived.jobs}
        dates={dates}
        today={today}
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
