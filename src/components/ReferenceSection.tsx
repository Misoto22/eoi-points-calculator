'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import type { Evaluation } from '@/lib/points';
import { invitationRounds } from '@/data/invitationRounds';
import { states } from '@/data/stateLists';

interface ReferenceSectionProps {
  totalPoints: number;
  evaluation: Evaluation;
}

function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  return (
    <div style={{ borderBottom: '1px solid var(--hair)' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex justify-between items-center gap-3.5 py-[18px] cursor-pointer text-left hover:text-[var(--muted)]"
        style={{ background: 'none', border: 'none', color: 'inherit' }}
      >
        <span className="text-[17px]" style={{ fontFamily: 'var(--font-serif)' }}>{title}</span>
        <span
          aria-hidden="true"
          className="text-lg font-light leading-none"
          style={{ color: 'var(--muted)', transition: 'transform 0.35s ease', transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      <div
        id={contentId}
        // Clipped content must also leave the tab order and accessibility tree
        inert={!open}
        className="grid"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="overflow-hidden">
          <div className="pt-1 pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function ReferenceSection({ totalPoints, evaluation }: ReferenceSectionProps) {
  const { t } = useTranslation();

  const jobsWithOcc = evaluation.jobs.filter((je) => je.occupation);

  return (
    <section className="mt-[72px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.3s backwards' }}>
      <SectionHeading num="04" title={t('sections.reference')} side="REFERENCE" />

      <div className="mt-[18px]">
        <Collapsible title={t('roundsTitle')}>
          <div
            className="grid gap-3 py-2 text-[11px] tracking-[0.12em] font-medium"
            style={{ gridTemplateColumns: '90px 56px 1fr 1fr 22px', borderBottom: '1px solid var(--ink)', color: 'var(--muted)' }}
          >
            <span>{t('roundsDate')}</span>
            <span>{t('roundsVisa')}</span>
            <span className="text-right">{t('roundsMin')}</span>
            <span className="text-right">{t('roundsInv')}</span>
            <span />
          </div>
          {invitationRounds.map((r) => {
            const hit = totalPoints >= r.minimumPoints && totalPoints > 0;
            return (
              <div
                key={r.date}
                title={hit ? t('roundsHitYes') : t('roundsHitNo')}
                className="grid gap-3 py-[11px] text-[13px] tabular-nums items-baseline"
                style={{ gridTemplateColumns: '90px 56px 1fr 1fr 22px', borderBottom: '1px solid var(--hair-soft)' }}
              >
                <span style={{ color: 'var(--ink-soft)' }}>{r.date}</span>
                <span style={{ color: 'var(--muted)' }}>{r.visa}</span>
                <span className="text-right">{r.minimumPoints}</span>
                <span className="text-right" style={{ color: 'var(--ink-soft)' }}>
                  {r.invitations.toLocaleString('en-US')}
                </span>
                <span className="flex justify-end">
                  <span
                    className="w-[7px] h-[7px] rounded-full"
                    style={{ border: '1px solid var(--muted)', background: hit ? 'var(--ink)' : 'transparent' }}
                  />
                </span>
              </div>
            );
          })}
          <p className="mt-4 mb-0 text-xs leading-[1.7] max-w-[56em]" style={{ color: 'var(--muted)' }}>
            {t('roundsNote')}
          </p>
        </Collapsible>

        <Collapsible title={t('statesTitle')}>
          <p className="mt-0 mb-2 text-[12.5px] leading-[1.75] max-w-[52em]" style={{ color: 'var(--muted)' }}>
            {t('statesIntro')}
          </p>
          {states.map((s) => {
            // Which of the selected occupations this state can nominate, per visa
            const jobMarks = jobsWithOcc.map((je) => {
              const visas = je.pathways
                .filter((p) => (p.code === '190' || p.code === '491') && p.states.includes(s.code))
                .map((p) => p.code);
              return { tag: String.fromCharCode(65 + je.index), visas };
            }).filter((m) => m.visas.length > 0);

            return (
              <div
                key={s.code}
                className="grid gap-4 py-[13px] items-baseline"
                style={{ gridTemplateColumns: '54px 1fr auto', borderBottom: '1px solid var(--hair-soft)' }}
              >
                <span className="text-[15.5px]" style={{ fontFamily: 'var(--font-serif)' }}>{s.code}</span>
                <div className="min-w-0">
                  <div className="text-[13px] leading-[1.5]" style={{ color: 'var(--ink)' }}>
                    {t(`states.${s.code}.how`)}
                  </div>
                  <div className="text-xs leading-[1.6] mt-[3px]" style={{ color: 'var(--muted)' }}>
                    {t(`states.${s.code}.tip`)}
                  </div>
                  {jobMarks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {jobMarks.map((m) => (
                        <span
                          key={m.tag}
                          className="text-[10.5px] tracking-[0.08em] tabular-nums leading-none"
                          style={{ color: 'var(--ink-soft)', border: '1px solid var(--hair)', padding: '3px 7px' }}
                        >
                          {m.tag}&nbsp;{m.visas.join(' · ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11.5px] tracking-[0.08em] underline underline-offset-4 whitespace-nowrap py-2 -my-2 hover:text-[var(--ink)]"
                  style={{ color: 'var(--muted)', textDecorationColor: 'var(--hair)' }}
                >
                  {t('visit')}&nbsp;↗
                </a>
              </div>
            );
          })}
          <p className="mt-3.5 mb-0 text-[11.5px] tracking-[0.03em]" style={{ color: 'var(--muted)' }}>
            {t('statesNote')}
          </p>
        </Collapsible>
      </div>
    </section>
  );
}
