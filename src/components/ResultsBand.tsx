'use client';

import { memo, useId, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import type { Evaluation, PathwayResult } from '@/lib/points';
import { PATHWAY_STATUS_LABEL_KEY, hasOccupation, pathwayStatus } from '@/lib/points';
import type { SharedCriteria } from '@/lib/types';
import { suggestionsFor } from '@/lib/suggestions';
import { GOAL_RANGE, MIN_POINTS } from '@/data/pointsCriteria';

interface ResultsBandProps {
  evaluation: Evaluation;
  shared: SharedCriteria;
  goal: number;
  displayTotal: number;
  onGoalDec: () => void;
  onGoalInc: () => void;
  onOpenExport: () => void;
  onCopyLink: () => void;
  copied: boolean;
  /** Omit where this page doesn't own enough of the scored data for "reset" to mean anything (see Independent Migration, which reads shared/jobs read-only from the Profile page). */
  onReset?: () => void;
  bandRef?: RefObject<HTMLDivElement | null>;
}

const SHARED_ROW_ORDER = [
  'age', 'english', 'education', 'stem', 'ausStudy', 'regionalStudy', 'communityLanguage', 'partnerStatus',
] as const;

interface PathPresentation {
  statusKey: string;
  totalText: string;
  totalColor: string;
  statusColor: string;
  dotBg: string;
  dotBorder: string;
}

function presentPath(p: PathwayResult): PathPresentation {
  const mutedRow = {
    statusColor: 'var(--band-muted)',
    dotBg: 'transparent',
    dotBorder: 'var(--band-muted)',
    totalColor: 'var(--band-muted)',
  };
  const status = pathwayStatus(p);
  const statusKey = PATHWAY_STATUS_LABEL_KEY[status];
  if (status === 'noOcc') {
    return { statusKey, totalText: String(p.total), ...mutedRow };
  }
  if (status === 'listNo') {
    return { statusKey, totalText: '—', ...mutedRow };
  }
  if (status === 'noState') {
    return { statusKey, totalText: String(p.total), ...mutedRow };
  }
  if (status === 'low') {
    return {
      statusKey,
      totalText: String(p.total),
      statusColor: 'var(--band-danger)',
      dotBg: 'transparent',
      dotBorder: 'var(--band-danger)',
      totalColor: 'var(--band-soft)',
    };
  }
  return {
    statusKey,
    totalText: String(p.total),
    statusColor: 'var(--band-ink)',
    dotBg: 'var(--band-ink)',
    dotBorder: 'var(--band-ink)',
    totalColor: 'var(--band-ink)',
  };
}

/**
 * Compact results band — the single results view on every breakpoint,
 * leading the Independent Migration page at a fixed compact width.
 */
function ResultsBand({
  evaluation, shared, goal, displayTotal,
  onGoalDec, onGoalInc, onOpenExport, onCopyLink, copied, onReset, bandRef,
}: ResultsBandProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const [showBreakdown, setShowBreakdown] = useState(false);
  const breakdownId = useId();

  // Headline reflects the bare score (裸分); per-pathway rows below show the
  // nomination-inclusive totals (+5 / +15) and eligibility.
  const total = evaluation.bareScore;

  let statusLine: string;
  if (total >= goal && total > 0) statusLine = t('statusOk');
  else if (total < MIN_POINTS) statusLine = t('statusBelowMin', { n: MIN_POINTS - total });
  else statusLine = t('statusMin', { n: goal - total });

  // `evaluation.best` is null both when no occupation is entered yet AND when
  // one is entered but nothing clears the list/state/points gates — those
  // need different copy, or a user who's already picked an occupation gets
  // told to go pick one.
  let bestPathLine = evaluation.jobs.some(hasOccupation) ? t('noPathEligible') : t('noBestPath');
  if (evaluation.best) {
    const occ = evaluation.best.job.occupation;
    const occName = occ ? (lang === 'zh' ? occ.zh : occ.en) : '';
    bestPathLine = `${t('bestPathPrefix')} — ${occName} · ${evaluation.best.code}`;
  }

  const sharedRows = SHARED_ROW_ORDER
    .filter((k) => evaluation.shared[k] > 0)
    .map((k) => ({ key: k, label: t(`bd.${k}`), value: evaluation.shared[k] }));

  const suggestions = useMemo(() => suggestionsFor(evaluation, shared, goal), [evaluation, shared, goal]);
  const progressScale = Math.min(displayTotal / goal, 1);

  return (
    <section className="mt-[72px] wide:mt-[76px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.24s backwards' }}>
      <SectionHeading num="03" title={t('sections.result')} side="RESULT" />

      <div
        ref={bandRef}
        className="mt-[30px]"
        style={{
          background: 'var(--band-bg)',
          color: 'var(--band-ink)',
          border: '1px solid var(--band-border)',
          padding: '24px 24px 20px',
          transition: 'background 0.4s ease, color 0.4s ease',
        }}
      >
        {/* Announce the settled score (not the animated displayTotal) to screen readers */}
        <span className="sr-only" role="status" aria-live="polite">
          {t('srTotal', { n: total })}
        </span>
        <div className="flex justify-between items-end gap-5 flex-wrap">
          <div className="flex flex-col gap-2.5 min-w-0">
            <span className="text-[0.71875rem] tracking-[0.22em] font-medium" style={{ color: 'var(--band-muted)' }}>
              {t('totalCaps')}
            </span>
            <span className="text-[0.84375rem]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--band-ink)' }}>
              {bestPathLine}
            </span>
            <span className="text-[0.8125rem]" style={{ color: 'var(--band-soft)' }}>{statusLine}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className="font-light tabular-nums"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '3.875rem',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
              }}
            >
              {displayTotal}
            </span>
            <span className="text-[0.8125rem]" style={{ color: 'var(--band-muted)' }}>{t('points')}</span>
          </div>
        </div>

        <div className="mt-[26px] h-0.5 relative" style={{ background: 'var(--band-hair)' }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'var(--band-ink)',
              transform: `scaleX(${progressScale})`,
              transformOrigin: 'left',
              transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>

        <div className="flex justify-between items-center gap-3.5 flex-wrap mt-3.5 text-[0.78125rem]" style={{ color: 'var(--band-muted)' }}>
          <span>{t('minimum')} {MIN_POINTS}</span>
          <div className="flex items-center gap-2.5" role="group" aria-label={t('goal')}>
            <span>{t('goal')}</span>
            <div className="flex items-stretch" style={{ border: '1px solid var(--band-hair)' }}>
              <button
                type="button"
                onClick={onGoalDec}
                aria-label={t('goalDec')}
                className="w-11 h-11 cursor-pointer text-sm leading-none p-0 hover:bg-[var(--band-hair-soft)]"
                style={{ background: 'none', border: 'none', color: 'var(--band-soft)' }}
              >
                −
              </button>
              <span
                aria-live="polite"
                className="flex items-center px-2.5 tabular-nums text-[0.8125rem]"
                style={{ color: 'var(--band-ink)', borderLeft: '1px solid var(--band-hair)', borderRight: '1px solid var(--band-hair)' }}
              >
                {goal}
              </span>
              <button
                type="button"
                onClick={onGoalInc}
                aria-label={t('goalInc')}
                className="w-11 h-11 cursor-pointer text-sm leading-none p-0 hover:bg-[var(--band-hair-soft)]"
                style={{ background: 'none', border: 'none', color: 'var(--band-soft)' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {sharedRows.length > 0 && (
          <div className="mt-5" style={{ borderTop: '1px solid var(--band-hair)' }}>
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              aria-expanded={showBreakdown}
              aria-controls={showBreakdown ? breakdownId : undefined}
              className="w-full flex justify-between items-center cursor-pointer pt-3 pb-1 text-[0.6875rem] tracking-[0.22em] font-medium"
              style={{ background: 'none', border: 'none', color: 'var(--band-muted)' }}
            >
              {t('sharedCaps')}
              <span aria-hidden="true" className="text-[0.875rem] font-light leading-none" style={{ transition: 'transform 0.3s ease', transform: showBreakdown ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            {showBreakdown && (
              <div id={breakdownId}>
                {sharedRows.map((r) => (
                  <div
                    key={r.key}
                    className="flex justify-between items-baseline gap-4 py-[7px] text-[0.78125rem]"
                    style={{ borderTop: '1px solid var(--band-hair-soft)' }}
                  >
                    <span style={{ color: 'var(--band-soft)' }}>{r.label}</span>
                    <span className="text-[0.84375rem] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-baseline gap-4 py-[7px] text-[0.78125rem]" style={{ borderTop: '1px solid var(--band-hair-soft)' }}>
                  <span style={{ color: 'var(--band-muted)' }}>{t('sharedSubtotal')}</span>
                  <span className="text-[0.84375rem] font-medium tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{evaluation.sharedTotal}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4" style={{ borderTop: '1px solid var(--band-hair)' }}>
          {evaluation.jobs.map((je) => (
            <div key={je.job.id} className="pt-3 pb-2.5" style={{ borderBottom: '1px solid var(--band-hair-soft)' }}>
              <div className="flex justify-between items-baseline gap-3">
                <span className="min-w-0 flex items-baseline gap-2.5">
                  <span className="text-[0.9375rem] flex-none" style={{ fontFamily: 'var(--font-serif)' }}>
                    {String.fromCharCode(65 + je.index)}
                  </span>
                  <span className="text-[0.78125rem] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--band-ink)' }}>
                    {je.occupation ? (lang === 'zh' ? je.occupation.zh : je.occupation.en) : t('noOccName')}
                  </span>
                </span>
                <span className="flex-none text-[0.875rem] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{je.base}</span>
              </div>
              <div className="flex gap-4 mt-1.5 flex-wrap">
                {je.pathways.map((p) => {
                  const pres = presentPath(p);
                  return (
                    <span key={p.code} className="flex items-center gap-1.5 text-[0.71875rem] tabular-nums" style={{ color: pres.statusColor }}>
                      <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ border: `1px solid ${pres.dotBorder}`, background: pres.dotBg }} />
                      {p.code}&nbsp;{pres.totalText}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-3.5">
            {/* The MLTSSL structural hint unlocks 189 — never crowd it out */}
            {[...suggestions.filter((s) => s.key === 'mltssl'), ...suggestions.filter((s) => s.key !== 'mltssl')].slice(0, 3).map((s) => (
              <div key={s.key} className="flex gap-3 items-baseline pt-2 text-[0.75rem] leading-[1.5]">
                <span className="flex-none text-[0.78125rem] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>+{s.points}</span>
                <span style={{ color: 'var(--band-soft)' }}>{t(`sug.${s.key}`)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={onOpenExport}
            className="cursor-pointer text-xs tracking-[0.18em] font-medium px-[22px] py-[13px] hover:opacity-85"
            style={{ background: 'var(--band-ink)', color: 'var(--band-bg)', border: 'none', transition: 'opacity 0.2s ease' }}
          >
            {t('exportBtn')}
          </button>
          <button
            type="button"
            onClick={onCopyLink}
            className="cursor-pointer text-xs tracking-[0.14em] px-5 py-3 hover:border-[var(--band-muted)] hover:text-[var(--band-ink)]"
            style={{
              background: 'none',
              color: 'var(--band-soft)',
              border: '1px solid var(--band-hair)',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
          >
            {copied ? t('copied') : t('copyLink')}
          </button>
          {onReset && total > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="cursor-pointer text-xs tracking-[0.14em] px-2.5 py-3 underline underline-offset-4 hover:text-[var(--band-ink)]"
              style={{ background: 'none', color: 'var(--band-muted)', border: 'none', textDecorationColor: 'var(--band-hair)' }}
            >
              {t('reset')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(ResultsBand);

export { GOAL_RANGE };
