'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import SectionHeading from './SectionHeading';
import type { JobAssessment, PlanningDates, SharedCriteria, SponsorshipInputs } from '@/lib/types';
import { findOccupation } from '@/lib/points';
import {
  GATE_LABEL_KEY,
  STREAM_LABEL_KEY,
  evaluateSponsorship,
} from '@/lib/employerSponsorship';
import type { SalaryBand } from '@/data/sponsorship';
import { CSIT, SSIT } from '@/data/sponsorship';

interface EmployerSponsorshipSectionProps {
  jobs: JobAssessment[];
  shared: SharedCriteria;
  dates: PlanningDates;
  today: string;
  inputs: SponsorshipInputs;
  onPatch: (patch: Partial<SponsorshipInputs>) => void;
}

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

function EditLink() {
  const { t } = useTranslation();
  return (
    <Link href="/profile" className="underline underline-offset-4 hover:text-[var(--ink)]" style={{ color: 'var(--muted)', textDecorationColor: 'var(--hair)' }}>
      {t('spProfileEditLink')}
    </Link>
  );
}

function ToggleRow({ label, hint, checked, onToggle }: { label: string; hint?: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex items-start gap-3 w-full px-1.5 py-[13px] cursor-pointer text-left hover:bg-[var(--hover)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--muted)] focus-visible:-outline-offset-1"
      style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--hair)', color: 'inherit', transition: 'background 0.15s ease' }}
    >
      <span
        aria-hidden="true"
        className="w-[15px] h-[15px] flex-none mt-0.5 flex items-center justify-center"
        style={{ border: '1px solid var(--muted)', background: checked ? 'var(--ink)' : 'transparent', transition: 'background 0.18s ease, border-color 0.18s ease' }}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5l2.3 2.3L8 1" stroke="var(--bg)" strokeWidth="1.4" fill="none" />
          </svg>
        )}
      </span>
      <span className="flex-1">
        <span className="block text-[0.84375rem] leading-[1.55]">{label}</span>
        {hint && <span className="block mt-0.5 text-xs leading-[1.5]" style={{ color: 'var(--muted)' }}>{hint}</span>}
      </span>
    </button>
  );
}

function BandOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex-1 cursor-pointer text-[0.78125rem] leading-[1.4] px-3 py-[13px] text-center hover:border-[var(--muted)]"
      style={{
        background: active ? 'var(--hover)' : 'var(--surface)',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--hair)'}`,
        color: active ? 'var(--ink)' : 'var(--ink-soft)',
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}

function EmployerSponsorshipSection({ jobs, shared, dates, today, inputs, onPatch }: EmployerSponsorshipSectionProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';

  const evalResult = evaluateSponsorship(jobs, shared, inputs, dates.birth, today);
  const jobsWithOcc = evalResult.jobs.filter((jr) => jr.job.anzsco !== '');

  const bandOptions: { value: SalaryBand; label: string }[] = [
    { value: 'belowCsit', label: t('spSalaryBelowCsit', { csit: fmt(CSIT) }) },
    { value: 'csitToSsit', label: t('spSalaryCsitToSsit', { csit: fmt(CSIT), ssit: fmt(SSIT) }) },
    { value: 'ssitPlus', label: t('spSalarySsitPlus', { ssit: fmt(SSIT) }) },
  ];

  return (
    <>
      {/* 01 — the sponsorship-specific checklist inputs, local to this page.
          Age/English/occupations live on the Profile page and are read from
          there (see the readout line and the per-occupation rows below) —
          this page never edits shared/jobs/dates itself. */}
      <section className="mt-[58px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.08s backwards' }}>
        <SectionHeading num="01" title={t('spDetailsTitle')} side="DETAILS" />
        <p className="mt-3.5 mb-0 text-[0.78125rem] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
          {t('spNote')}
        </p>

        <p className="mt-2.5 mb-0 text-[0.78125rem] leading-[1.6]" style={{ color: 'var(--ink-soft)' }}>
          {evalResult.ageYears !== null
            ? t('spAgeLine', { age: evalResult.ageYears })
            : evalResult.ageUnder45 === true
              ? t('spAgeBracketUnder45')
              : t('spAgeUnknown')}
          {' · '}
          {evalResult.englishOk ? t('spEnglishOk') : t('spEnglishUnknown')}
          {' · '}
          <EditLink />
        </p>

        {/* One coherent vertical list — a 3-across grid here would fragment
            unevenly on wide screens since the salary picker's natural height
            doesn't match the toggle rows either side of it. */}
        <div className="mt-[22px]">
          <ToggleRow
            label={t('spHasSponsor')}
            checked={inputs.hasSponsor}
            onToggle={() => onPatch({ hasSponsor: !inputs.hasSponsor })}
          />
          <div className="py-[18px]" style={{ borderBottom: '1px solid var(--hair)' }}>
            <div className="text-[0.71875rem] tracking-[0.16em] font-medium mb-2.5" style={{ color: 'var(--muted)' }}>
              {t('spSalaryLabel')}
            </div>
            <div className="flex gap-1.5">
              {bandOptions.map((o) => (
                <BandOption
                  key={o.value}
                  label={o.label}
                  active={inputs.salaryBand === o.value}
                  onClick={() => onPatch({ salaryBand: inputs.salaryBand === o.value ? '' : o.value })}
                />
              ))}
            </div>
          </div>
          <ToggleRow
            label={t('spTrtEligible')}
            hint={t('spTrtHint')}
            checked={inputs.trtEligible}
            onToggle={() => onPatch({ trtEligible: !inputs.trtEligible })}
          />
        </div>
      </section>

      {/* 02 — per-occupation eligibility across all four streams. */}
      <section className="mt-[58px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.24s backwards' }}>
        <SectionHeading num="02" title={t('spEligibilityTitle')} side="ELIGIBILITY" />

        {jobsWithOcc.length === 0 ? (
          <p className="mt-[22px] mb-0 text-[0.78125rem]" style={{ color: 'var(--muted)' }}>{t('spEmpty')} <EditLink /></p>
        ) : (
          <div className="mt-[22px] flex flex-col gap-[26px]">
            {jobsWithOcc.map((jr) => {
              const occ = findOccupation(jr.job.anzsco);
              const tag = String.fromCharCode(65 + jr.index);
              return (
                <div key={jr.job.id}>
                  <div className="flex items-baseline gap-2.5 mb-1">
                    <span className="text-[0.96875rem]" style={{ fontFamily: 'var(--font-serif)' }}>{tag}</span>
                    <span className="text-[0.84375rem]" style={{ color: 'var(--ink)' }}>
                      {occ ? (lang === 'zh' ? occ.zh : occ.en) : jr.job.anzsco}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{jr.job.anzsco}</span>
                  </div>
                  {jr.streams.map((s) => {
                    const failed = s.gates.filter((g) => !g.ok);
                    return (
                      <div
                        key={s.code}
                        className="grid gap-4 py-[11px] items-baseline"
                        style={{ gridTemplateColumns: '1fr auto', borderBottom: '1px solid var(--hair-soft)' }}
                      >
                        <div className="min-w-0">
                          <div className="text-[0.8125rem] leading-[1.5]" style={{ color: 'var(--ink)' }}>{t(STREAM_LABEL_KEY[s.code])}</div>
                          {!s.eligible && (
                            <div className="text-xs leading-[1.5] mt-[2px]" style={{ color: 'var(--muted)' }}>
                              {failed.map((g) => t(GATE_LABEL_KEY[g.key], g.params)).join(' · ')}
                            </div>
                          )}
                        </div>
                        <span
                          className="text-[0.6875rem] tracking-[0.1em] uppercase whitespace-nowrap"
                          style={{ color: s.eligible ? 'var(--ink-soft)' : 'var(--danger)' }}
                        >
                          {s.eligible ? t('spEligible') : t('spNotEligible')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-[22px] mb-0 text-[0.71875rem] tracking-[0.03em]" style={{ color: 'var(--muted)' }}>
          {t('spDisclaimer')}
        </p>
      </section>
    </>
  );
}

export default memo(EmployerSponsorshipSection);
