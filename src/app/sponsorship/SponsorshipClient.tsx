'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
import EmployerSponsorshipSection from '@/components/EmployerSponsorshipSection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { applyDates } from '@/lib/timeline';
import { defaultSponsorshipInputs } from '@/lib/types';
import type { SponsorshipInputs } from '@/lib/types';
import { readInitialState } from '@/lib/urlState';
import '@/app/i18n/client';

function PageSkeleton() {
  return (
    <div className="max-w-[780px] mx-auto px-[26px] pt-[34px]">
      <div className="h-4 w-28 mb-[72px]" style={{ backgroundColor: 'var(--hair)' }} />
      <div className="h-10 w-3/4 mb-[60px]" style={{ backgroundColor: 'var(--hair)' }} />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11" style={{ backgroundColor: 'var(--hair)', opacity: 0.5 }} />
        ))}
      </div>
    </div>
  );
}

const PageContent = () => {
  const { ready } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Read-only: this page never writes back to the shared/jobs/dates state —
  // editing those only happens on the Independent Migration page.
  const initial = useMemo(() => readInitialState(), []);
  const [inputs, setInputs] = useLocalStorage<SponsorshipInputs>('eoi-sponsorship', defaultSponsorshipInputs);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Same date-derived brackets the points-tested page would show today —
  // keeps this page's "current" occupation/English/age readout in sync even
  // when the user entered a birth month or work-start date rather than
  // picking a bracket by hand.
  const derived = useMemo(
    () => applyDates(initial.shared, initial.jobs, initial.dates, today),
    [initial, today],
  );

  const patchInputs = (patch: Partial<SponsorshipInputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  if (!ready || !mounted) return <PageSkeleton />;

  return (
    <div
      className="max-w-[780px] mx-auto"
      style={{
        paddingLeft: 'max(26px, env(safe-area-inset-left))',
        paddingRight: 'max(26px, env(safe-area-inset-right))',
      }}
    >
      <Header titleKey="spPageTitle" subtitleKey="spPageSubtitle" />

      <EmployerSponsorshipSection
        jobs={derived.jobs}
        shared={derived.shared}
        dates={initial.dates}
        today={today}
        inputs={inputs}
        onPatch={patchInputs}
      />

      <Footer />
    </div>
  );
};

export default function SponsorshipClient() {
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
