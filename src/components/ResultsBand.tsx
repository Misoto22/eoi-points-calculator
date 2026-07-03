'use client';

import { useState } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import { occupationDisplayName } from './JobCard';
import type { Evaluation, PathwayResult } from '@/lib/points';
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
  onReset: () => void;
  bandRef?: RefObject<HTMLDivElement | null>;
  /** 'panel' = compact sticky-sidebar variant for the wide layout */
  variant?: 'full' | 'panel';
}

const SHARED_ROW_ORDER = [
  'age', 'english', 'education', 'stem', 'ausStudy', 'regionalStudy', 'communityLanguage', 'partnerStatus',
] as const;
const JOB_ROW_ORDER = ['ausWork', 'overseasWork', 'professionalYear'] as const;

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
  if (!p.hasOccupation) {
    return { statusKey: 'pathNoOcc', totalText: String(p.total), ...mutedRow };
  }
  if (!p.listOk) {
    return { statusKey: 'pathListNo', totalText: '—', ...mutedRow };
  }
  if (p.code !== '189' && p.states.length === 0) {
    return { statusKey: 'pathNoState', totalText: String(p.total), ...mutedRow };
  }
  if (p.total < MIN_POINTS) {
    return {
      statusKey: 'pathLow',
      totalText: String(p.total),
      statusColor: 'var(--band-danger)',
      dotBg: 'transparent',
      dotBorder: 'var(--band-danger)',
      totalColor: 'var(--band-soft)',
    };
  }
  return {
    statusKey: 'pathOk',
    totalText: String(p.total),
    statusColor: 'var(--band-ink)',
    dotBg: 'var(--band-ink)',
    dotBorder: 'var(--band-ink)',
    totalColor: 'var(--band-ink)',
  };
}

export default function ResultsBand({
  evaluation, shared, goal, displayTotal,
  onGoalDec, onGoalInc, onOpenExport, onCopyLink, copied, onReset, bandRef,
  variant = 'full',
}: ResultsBandProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const panel = variant === 'panel';
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Headline reflects the bare score (裸分); per-pathway rows below show the
  // nomination-inclusive totals (+5 / +15) and eligibility.
  const total = evaluation.bareScore;

  let statusLine: string;
  let warnColor = 'var(--band-muted)';
  if (total >= goal && total > 0) statusLine = t('statusOk');
  else if (total < MIN_POINTS) { statusLine = t('statusBelowMin', { n: MIN_POINTS - total }); warnColor = 'var(--band-danger)'; }
  else statusLine = t('statusMin', { n: goal - total });

  let bestPathLine = t('noBestPath');
  if (evaluation.best) {
    const occ = evaluation.best.job.occupation;
    const occName = occ ? (lang === 'zh' ? occ.zh : occ.en) : '';
    bestPathLine = `${t('bestPathPrefix')} — ${occName} · ${evaluation.best.code}`;
  }

  const sharedRows = SHARED_ROW_ORDER
    .filter((k) => evaluation.shared[k] > 0)
    .map((k) => ({ key: k, label: t(`bd.${k}`), value: evaluation.shared[k] }));

  const suggestions = suggestionsFor(evaluation, shared, goal);
  const progressScale = Math.min(displayTotal / goal, 1);

  return (
    <section className={panel ? 'mt-[72px] wide:mt-[76px]' : 'mt-[72px]'} style={{ animation: 'eoiFadeUp 0.7s ease 0.24s backwards' }}>
      <SectionHeading num="03" title={t('sections.result')} side="RESULT" />

      <div
        ref={bandRef}
        className="mt-[30px]"
        style={{
          background: 'var(--band-bg)',
          color: 'var(--band-ink)',
          border: '1px solid var(--band-border)',
          padding: panel ? '24px 24px 20px' : 'clamp(26px, 5vw, 46px)',
          transition: 'background 0.4s ease, color 0.4s ease',
        }}
      >
        <div className="flex justify-between items-end gap-5 flex-wrap">
          <div className="flex flex-col gap-2.5">
            <span className="text-[11.5px] tracking-[0.22em] font-medium" style={{ color: 'var(--band-muted)' }}>
              {t('totalCaps')}
            </span>
            <span className={panel ? 'text-[13.5px]' : 'text-[15px]'} style={{ fontFamily: 'var(--font-serif)', color: 'var(--band-ink)' }}>
              {bestPathLine}
            </span>
            <span className="text-[13px]" style={{ color: 'var(--band-soft)' }}>{statusLine}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className="font-light tabular-nums"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: panel ? '62px' : 'clamp(64px, 11vw, 92px)',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
              }}
            >
              {displayTotal}
            </span>
            <span className="text-[13px]" style={{ color: 'var(--band-muted)' }}>{t('points')}</span>
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

        <div className="flex justify-between items-center gap-3.5 flex-wrap mt-3.5 text-[12.5px]" style={{ color: 'var(--band-muted)' }}>
          <span>{t('minimum')} {MIN_POINTS}</span>
          <div className="flex items-center gap-2.5">
            <span>{t('goal')}</span>
            <div className="flex items-stretch" style={{ border: '1px solid var(--band-hair)' }}>
              <button
                type="button"
                onClick={onGoalDec}
                aria-label="Decrease goal"
                className="w-9 h-8 cursor-pointer text-sm leading-none p-0 hover:bg-[var(--band-hair-soft)]"
                style={{ background: 'none', border: 'none', color: 'var(--band-soft)' }}
              >
                −
              </button>
              <span
                className="flex items-center px-2.5 tabular-nums text-[13px]"
                style={{ color: 'var(--band-ink)', borderLeft: '1px solid var(--band-hair)', borderRight: '1px solid var(--band-hair)' }}
              >
                {goal}
              </span>
              <button
                type="button"
                onClick={onGoalInc}
                aria-label="Increase goal"
                className="w-9 h-8 cursor-pointer text-sm leading-none p-0 hover:bg-[var(--band-hair-soft)]"
                style={{ background: 'none', border: 'none', color: 'var(--band-soft)' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {!panel && total < goal && (
          <p className="mt-5 mb-0 text-[13px] leading-[1.6]" style={{ color: warnColor }}>{statusLine}</p>
        )}

        {panel && sharedRows.length > 0 && (
          <div className="mt-5" style={{ borderTop: '1px solid var(--band-hair)' }}>
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              aria-expanded={showBreakdown}
              className="w-full flex justify-between items-center cursor-pointer pt-3 pb-1 text-[11px] tracking-[0.22em] font-medium"
              style={{ background: 'none', border: 'none', color: 'var(--band-muted)' }}
            >
              {t('sharedCaps')}
              <span aria-hidden="true" className="text-[14px] font-light leading-none" style={{ transition: 'transform 0.3s ease', transform: showBreakdown ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            {showBreakdown && sharedRows.map((r) => (
              <div
                key={r.key}
                className="flex justify-between items-baseline gap-4 py-[7px] text-[12.5px]"
                style={{ borderTop: '1px solid var(--band-hair-soft)' }}
              >
                <span style={{ color: 'var(--band-soft)' }}>{r.label}</span>
                <span className="text-[13.5px] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        )}

        {!panel && sharedRows.length > 0 && (
          <div className="mt-[30px]" style={{ borderTop: '1px solid var(--band-hair)' }}>
            <div className="pt-4 pb-1.5 text-[11.5px] tracking-[0.22em] font-medium" style={{ color: 'var(--band-muted)' }}>
              {t('sharedCaps')}
            </div>
            {sharedRows.map((r) => (
              <div
                key={r.key}
                className="flex justify-between items-baseline gap-4 py-2.5 text-[13.5px]"
                style={{ borderBottom: '1px solid var(--band-hair-soft)' }}
              >
                <span style={{ color: 'var(--band-soft)' }}>{r.label}</span>
                <span className="text-[15px] font-medium tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                  {r.value}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-baseline gap-4 py-[11px] text-[13px]">
              <span style={{ color: 'var(--band-muted)' }}>{t('sharedSubtotal')}</span>
              <span className="text-base font-medium tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                {evaluation.sharedTotal}
              </span>
            </div>
          </div>
        )}

        {panel && (
          <div className="mt-4" style={{ borderTop: '1px solid var(--band-hair)' }}>
            {evaluation.jobs.map((je) => (
              <div key={je.job.id} className="pt-3 pb-2.5" style={{ borderBottom: '1px solid var(--band-hair-soft)' }}>
                <div className="flex justify-between items-baseline gap-3">
                  <span className="min-w-0 flex items-baseline gap-2.5">
                    <span className="text-[15px] flex-none" style={{ fontFamily: 'var(--font-serif)' }}>
                      {String.fromCharCode(65 + je.index)}
                    </span>
                    <span className="text-[12.5px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--band-ink)' }}>
                      {je.occupation ? (lang === 'zh' ? je.occupation.zh : je.occupation.en) : t('noOccName')}
                    </span>
                  </span>
                  <span className="flex-none text-[14px] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{je.base}</span>
                </div>
                <div className="flex gap-4 mt-1.5">
                  {je.pathways.map((p) => {
                    const pres = presentPath(p);
                    return (
                      <span key={p.code} className="flex items-center gap-1.5 text-[11.5px] tabular-nums" style={{ color: pres.statusColor }}>
                        <span className="w-[6px] h-[6px] rounded-full flex-none" style={{ border: `1px solid ${pres.dotBorder}`, background: pres.dotBg }} />
                        {p.code}&nbsp;{pres.totalText}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!panel && evaluation.jobs.map((je) => (
          <div key={je.job.id} className="mt-[26px] px-[22px] pt-5 pb-2" style={{ border: '1px solid var(--band-hair)' }}>
            <div className="flex justify-between items-baseline gap-3.5 flex-wrap">
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
                  {String.fromCharCode(65 + je.index)}
                </span>
                <span className="text-[13.5px] leading-[1.4]" style={{ color: 'var(--band-ink)' }}>
                  {je.occupation ? occupationDisplayName(je.occupation, lang) : t('noOccName')}
                </span>
                {je.occupation && (
                  <span
                    className="flex-none text-[10px] tracking-[0.1em]"
                    style={{ color: 'var(--band-muted)', border: '1px solid var(--band-hair)', padding: '2px 7px' }}
                  >
                    {je.occupation.list}
                  </span>
                )}
              </div>
              <span className="text-xs" style={{ color: 'var(--band-muted)' }}>
                {t('jobBase')}&nbsp;
                <span className="text-[15px] tabular-nums" style={{ fontFamily: 'var(--font-serif)', color: 'var(--band-ink)' }}>
                  {je.base}
                </span>
              </span>
            </div>

            {JOB_ROW_ORDER.filter((k) => je.points[k] > 0).map((k) => (
              <div
                key={k}
                className="flex justify-between items-baseline gap-4 pt-[9px] pb-2 text-[13px]"
                style={{ borderTop: '1px solid var(--band-hair-soft)' }}
              >
                <span style={{ color: 'var(--band-soft)' }}>{t(`bd.${k}`)}</span>
                <span className="text-sm tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{je.points[k]}</span>
              </div>
            ))}

            <div className="mt-2.5" style={{ borderTop: '1px solid var(--band-hair)' }}>
              {je.pathways.map((p) => {
                const pres = presentPath(p);
                return (
                  <div
                    key={p.code}
                    className="grid items-baseline gap-3 py-[11px] text-[13px]"
                    style={{ gridTemplateColumns: '46px 1fr auto auto', borderBottom: '1px solid var(--band-hair-soft)' }}
                  >
                    <span className="text-base tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{p.code}</span>
                    <span className="min-w-0">
                      <span className="text-xs" style={{ color: 'var(--band-muted)' }}>
                        {t(`pathNoteByCode.${p.code}`)}
                      </span>
                      {p.states.length > 0 && (
                        <span className="flex flex-wrap gap-1 mt-1.5">
                          {p.states.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] tracking-[0.08em] leading-none"
                              style={{ color: 'var(--band-soft)', border: '1px solid var(--band-hair)', padding: '3px 6px' }}
                            >
                              {s}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="text-base font-medium tabular-nums" style={{ fontFamily: 'var(--font-serif)', color: pres.totalColor }}>
                      {pres.totalText}
                    </span>
                    <span
                      className="flex items-center gap-[7px] text-[11.5px] justify-self-end justify-end min-w-16"
                      style={{ color: pres.statusColor }}
                    >
                      <span
                        className="w-[7px] h-[7px] rounded-full"
                        style={{ border: `1px solid ${pres.dotBorder}`, background: pres.dotBg }}
                      />
                      {t(pres.statusKey)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!panel && (
          <p className="mt-[18px] mb-0 text-[11.5px] leading-[1.8]" style={{ color: 'var(--band-muted)' }}>
            {t('pathNote')}
          </p>
        )}

        {suggestions.length > 0 && (panel ? (
          <div className="mt-3.5">
            {suggestions.slice(0, 3).map((s) => (
              <div key={s.key} className="flex gap-3 items-baseline pt-2 text-[12px] leading-[1.5]">
                <span className="flex-none text-[12.5px] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>+{s.points}</span>
                <span style={{ color: 'var(--band-soft)' }}>{t(`sug.${s.key}`)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-[26px] px-5 pt-[18px] pb-5" style={{ border: '1px solid var(--band-hair)' }}>
            <div className="text-[11.5px] tracking-[0.22em] font-medium" style={{ color: 'var(--band-muted)' }}>
              {t('suggestionCaps')}
            </div>
            {suggestions.map((s) => (
              <div key={s.key} className="flex gap-3.5 items-baseline pt-3 text-[13px] leading-[1.55]">
                <span className="flex-none text-sm tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
                  +{s.points}
                </span>
                <span style={{ color: 'var(--band-soft)' }}>{t(`sug.${s.key}`)}</span>
              </div>
            ))}
          </div>
        ))}

        <div className={panel ? 'flex flex-wrap items-center gap-2.5 mt-6' : 'flex flex-wrap items-center gap-2.5 mt-[34px]'}>
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
          {total > 0 && (
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

export { GOAL_RANGE };
