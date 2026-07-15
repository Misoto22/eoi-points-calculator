'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectField, { pointsTag } from './SelectField';
import CheckRow from './CheckRow';
import MonthField from './MonthField';
import SubMonthRow from './SubMonthRow';
import type { JobAssessment } from '@/lib/types';
import { isYm } from '@/lib/types';
import type { JobEvaluation } from '@/lib/points';
import type { Occupation } from '@/data/occupations';
import { occupations } from '@/data/occupations';
import { jobSelectCriteria, professionalYearPoints } from '@/data/pointsCriteria';
import type { JobSelectField } from '@/data/pointsCriteria';
import { assessingAuthority } from '@/data/assessingAuthorities';
import { addMonths } from '@/lib/timeline';

export interface JobUIState {
  q: string;
  open: boolean;
}

interface JobCardProps {
  job: JobAssessment;
  evaluation: JobEvaluation;
  canRemove: boolean;
  ui: JobUIState;
  onPatch: (patch: Partial<JobAssessment>) => void;
  onUIPatch: (patch: Partial<JobUIState>) => void;
  onRemove: () => void;
  openSelect: string | null;
  setOpenSelect: (key: string | null) => void;
  /** When true, the ausWork select shows the date-derived bracket and is locked. */
  ausWorkLocked?: boolean;
  /** When true, the overseasWork select shows the date-derived bracket and is locked. */
  overseasWorkLocked?: boolean;
  /** Accordion: collapsed cards render as a one-line summary row */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function occupationDisplayName(occ: Occupation | null, lang: string): string {
  if (!occ) return '';
  return lang === 'zh' ? `${occ.zh} · ${occ.en}` : occ.en;
}

const MAX_RESULTS = 8;
// Prebuilt lowercase index so a search keystroke doesn't re-lowercase all
// 500+ occupation names
const searchIndex = occupations.map((o) => ({ occ: o, enLower: o.en.toLowerCase() }));
const SELECT_FIELDS: JobSelectField[] = ['ausWork', 'overseasWork'];
// Optional work-period inputs under each experience select — one home per fact
const START_FIELD: Record<JobSelectField, 'ausWorkStart' | 'overseasWorkStart'> = {
  ausWork: 'ausWorkStart',
  overseasWork: 'overseasWorkStart',
};
const END_FIELD: Record<JobSelectField, 'ausWorkEnd' | 'overseasWorkEnd'> = {
  ausWork: 'ausWorkEnd',
  overseasWork: 'overseasWorkEnd',
};

const listTagStyle = {
  fontSize: '0.625rem',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
  border: '1px solid var(--hair)',
  padding: '2px 7px',
} as const;

export default function JobCard({
  job, evaluation, canRemove, ui, onPatch, onUIPatch, onRemove, openSelect, setOpenSelect,
  ausWorkLocked, overseasWorkLocked, collapsed, onToggleCollapse,
}: JobCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const searchId = useId();
  const searchListId = `${searchId}-list`;
  const searchLabelId = `${searchId}-label`;
  const bodyId = `${searchId}-body`;
  const searchListRef = useRef<HTMLDivElement | null>(null);

  // Same focus-roving idiom as SelectField: ArrowDown/Up moves real focus
  // through the option buttons; Enter then activates the focused option.
  const moveOptionFocus = (delta: number) => {
    const opts = searchListRef.current
      ? Array.from(searchListRef.current.querySelectorAll<HTMLButtonElement>('[role="option"]'))
      : [];
    if (!opts.length) return;
    const idx = opts.indexOf(document.activeElement as HTMLButtonElement);
    const next = idx < 0
      ? (delta > 0 ? 0 : opts.length - 1)
      : Math.min(Math.max(idx + delta, 0), opts.length - 1);
    opts[next].focus();
  };

  const pickOccupation = (anzsco: string) => {
    onPatch({ anzsco });
    onUIPatch({ open: false, q: '' });
    // The input unmounts on selection; hand focus to the display button that
    // replaces it (both carry searchId, never rendered together)
    requestAnimationFrame(() => document.getElementById(searchId)?.focus());
  };

  const occ = evaluation.occupation;
  const tag = String.fromCharCode(65 + evaluation.index);
  const qRaw = ui.q.trim();
  const filtered = useMemo(() => {
    if (!qRaw) return occupations;
    const q = qRaw.toLowerCase();
    return searchIndex
      .filter((r) => r.occ.anzsco.includes(q) || r.enLower.includes(q) || r.occ.zh.includes(qRaw))
      .map((r) => r.occ);
  }, [qRaw]);
  const showDisplay = !!occ && !ui.open;
  const showSearch = !occ || ui.open;
  const cardActive = ui.open || !!openSelect?.startsWith(`${job.id}:`);

  const open = !collapsed;

  // Clip the body only while collapsed or mid-height-animation. In the open
  // steady state overflow stays visible so self-managed popovers (month
  // pickers) can extend past the card edge; transitionend plus a fallback
  // timer marks the animation done.
  const [animating, setAnimating] = useState(false);
  const prevCollapsed = useRef(collapsed);
  useEffect(() => {
    if (prevCollapsed.current === collapsed) return;
    prevCollapsed.current = collapsed;
    // Deliberately keyed on `collapsed` rather than `animating`: a rapid
    // re-toggle mid-animation must restart the 450ms window (old timer
    // cleared, fresh one set), not leave `animating` unchanged and let the
    // first timer cut the clip off early on the second transition.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 450);
    return () => clearTimeout(timer);
  }, [collapsed]);

  return (
    <div
      className="mt-3 relative"
      style={{
        border: '1px solid var(--hair)',
        background: 'var(--surface)',
        // Open card floats above collapsed siblings so its popovers never
        // paint underneath them; active dropdowns still take precedence.
        zIndex: cardActive ? 30 : open ? 20 : 1,
        animation: 'eoiFadeUp 0.4s ease backwards',
      }}
    >
      {/* Header — identical geometry in both states; only the chips toggle.
          The chevron rotates in place, so it never jumps between layouts. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex-1 min-w-0 flex items-center gap-3 py-3 cursor-pointer text-left hover:bg-[var(--hover)]"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            paddingLeft: 'clamp(18px, 3.4vw, 28px)',
            // Without the remove button the chevron ends the row — keep it
            // clear of the card edge; with it, the × supplies the margin.
            paddingRight: canRemove ? '10px' : 'clamp(18px, 3.4vw, 28px)',
            transition: 'background 0.15s ease',
          }}
        >
          <span className="text-[1rem] leading-none flex-none" style={{ fontFamily: 'var(--font-serif)' }}>{tag}</span>
          {occ ? (
            <>
              <span className="text-xs tabular-nums flex-none" style={{ color: 'var(--muted)' }}>{occ.anzsco}</span>
              <span className="text-[0.8125rem] overflow-hidden text-ellipsis whitespace-nowrap">
                {lang === 'zh' ? occ.zh : occ.en}
              </span>
            </>
          ) : (
            <span className="text-[0.71875rem] tracking-[0.16em] font-medium" style={{ color: 'var(--muted)' }}>
              {t('jobCaps')}
            </span>
          )}
          {collapsed && (
            <span className="flex-none hidden sm:flex items-center gap-1.5">
              {job.ausWork && <span style={listTagStyle}>{t('chipAus', { v: job.ausWork })}</span>}
              {job.overseasWork && <span style={listTagStyle}>{t('chipOvs', { v: job.overseasWork })}</span>}
              {job.professionalYear && <span style={listTagStyle}>PY</span>}
            </span>
          )}
          <span className="ml-auto flex-none text-xs" style={{ color: 'var(--muted)' }}>
            {t('jobSubtotal')}&nbsp;
            <span className="text-[0.9375rem] tabular-nums" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>
              {evaluation.base}
            </span>
          </span>
          <svg
            width="10" height="6" viewBox="0 0 10 6" fill="none" className="flex-none" aria-hidden="true"
            style={{ transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M1 1l4 4 4-4" stroke="var(--muted)" strokeWidth="1.2" fill="none" />
          </svg>
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            title={t('removeJob')}
            aria-label={t('removeJob')}
            className="cursor-pointer text-[1rem] leading-none w-11 h-11 mr-0.5 flex-none flex items-center justify-center hover:text-[var(--danger)]"
            style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
          >
            ×
          </button>
        )}
      </div>

      {/* Body — symmetric height animation, same idiom as the Reference collapsibles */}
      <div
        id={bodyId}
        inert={collapsed}
        className="grid"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
        onTransitionEnd={(e) => { if (e.propertyName === 'grid-template-rows') setAnimating(false); }}
      >
        {/* min-w-0: with overflow visible the grid item's automatic minimum
            width is min-content, which lets nowrap text widen the card */}
        <div className={`min-w-0 ${cardActive || (open && !animating) ? 'overflow-visible' : 'overflow-hidden'}`}>
          <div style={{ padding: '0 clamp(18px, 3.4vw, 28px) clamp(18px, 3.4vw, 28px)' }}>

      {/* Occupation: searchable dropdown */}
      <div data-dd="true" className="relative mt-[18px]">
        <label
          id={searchLabelId}
          htmlFor={searchId}
          className="block text-[0.71875rem] tracking-[0.16em] font-medium mb-2.5"
          style={{ color: 'var(--muted)' }}
        >
          {t('jobField')}
        </label>
        {showDisplay && occ && (
          <div className="flex items-stretch" style={{ border: '1px solid var(--hair)', background: 'var(--bg)' }}>
            <button
              type="button"
              id={searchId}
              onClick={(e) => { e.stopPropagation(); onUIPatch({ open: true, q: '' }); }}
              className="flex-1 flex items-baseline gap-3 px-3.5 py-[13px] cursor-pointer text-left min-w-0 hover:bg-[var(--hover)]"
              style={{ background: 'none', border: 'none', color: 'inherit' }}
            >
              <span className="text-xs tabular-nums flex-none" style={{ color: 'var(--muted)' }}>{occ.anzsco}</span>
              <span className="text-[0.84375rem] leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap">
                {occupationDisplayName(occ, lang)}
              </span>
              <span className="flex-none" style={listTagStyle}>{occ.list}</span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPatch({ anzsco: '' }); onUIPatch({ open: false, q: '' }); }}
              title={t('clearOcc')}
              aria-label={t('clearOcc')}
              className="cursor-pointer text-[0.9375rem] px-4 hover:text-[var(--danger)]"
              style={{ background: 'none', border: 'none', borderLeft: '1px solid var(--hair)', color: 'var(--muted)' }}
            >
              ×
            </button>
          </div>
        )}
        {showSearch && (
          <input
            id={searchId}
            role="combobox"
            aria-expanded={ui.open}
            aria-controls={ui.open ? searchListId : undefined}
            aria-autocomplete="list"
            value={ui.q}
            onChange={(e) => onUIPatch({ q: e.target.value, open: true })}
            onFocus={() => onUIPatch({ open: true })}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
              e.preventDefault();
              if (!ui.open) onUIPatch({ open: true });
              requestAnimationFrame(() => moveOptionFocus(e.key === 'ArrowDown' ? 1 : -1));
            }}
            placeholder={t('jobSearch')}
            className="w-full box-border px-3.5 py-[13px] text-[1rem] outline-none focus:border-[var(--muted)]"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--hair)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s ease',
            }}
          />
        )}
        {ui.open && (
          <div
            className="absolute z-50 left-0 right-0 max-h-[296px] overflow-auto"
            style={{
              top: 'calc(100% + 6px)',
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow)',
              animation: 'eoiDropIn 0.18s ease backwards',
            }}
          >
            {/* Only option children may live inside the listbox — the empty
                state and count hint render as siblings */}
            <div
              ref={searchListRef}
              id={searchListId}
              role="listbox"
              aria-labelledby={searchLabelId}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                e.preventDefault();
                moveOptionFocus(e.key === 'ArrowDown' ? 1 : -1);
              }}
            >
              {filtered.slice(0, MAX_RESULTS).map((o) => (
                <button
                  key={o.anzsco}
                  type="button"
                  role="option"
                  aria-selected={job.anzsco === o.anzsco}
                  onClick={() => pickOccupation(o.anzsco)}
                  className="grid items-baseline gap-3 w-full px-3.5 py-3 cursor-pointer text-[0.8125rem] text-left leading-[1.45] hover:bg-[var(--hover)]"
                  style={{
                    gridTemplateColumns: '62px 1fr auto',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--hair-soft)',
                    color: 'var(--ink)',
                  }}
                >
                  <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{o.anzsco}</span>
                  <span>{lang === 'zh' ? `${o.zh} · ${o.en}` : o.en}</span>
                  <span style={listTagStyle}>{o.list}</span>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="m-0 p-3.5 text-[0.78125rem]" style={{ color: 'var(--muted)' }}>{t('occNo')}</p>
            )}
            <div
              className="px-3.5 py-[9px] text-[0.6875rem] tracking-[0.05em]"
              style={{ color: 'var(--muted)', borderTop: '1px solid var(--hair-soft)' }}
            >
              {t('occCount', { n: Math.min(MAX_RESULTS, filtered.length), m: filtered.length })}&nbsp;·&nbsp;{t('occHint')}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-x-7 gap-y-[22px] mt-[22px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
        {SELECT_FIELDS.map((field) => {
          const key = `${job.id}:${field}`;
          const startField = START_FIELD[field];
          // Derive lock state per field from parent-provided booleans
          const locked = field === 'ausWork' ? ausWorkLocked : field === 'overseasWork' ? overseasWorkLocked : false;
          return (
            <div key={field}>
              <SelectField
                label={t(`fields.${field}`)}
                placeholder={t('placeholder')}
                options={jobSelectCriteria[field].map((o) => ({
                  value: o.value,
                  label: t(`options.${field}.${o.value || 'none'}`),
                  points: o.points,
                }))}
                value={job[field]}
                open={openSelect === key}
                onToggle={() => setOpenSelect(openSelect === key ? null : key)}
                onPick={(v) => { onPatch({ [field]: v }); setOpenSelect(null); }}
                fieldBg="bg"
                lockedNote={locked ? t('tlDerived') : undefined}
              />
              {/* Precise alternative to the bracket: a work period that derives it
                  (10-year window; empty end = ongoing) */}
              <SubMonthRow
                label={t('jobStartMonth')}
                value={job[startField]}
                onChange={(v) => onPatch({ [startField]: v })}
                placeholder={t('tlPickMonth')}
                endValue={job[END_FIELD[field]]}
                onEndChange={(v) => onPatch({ [END_FIELD[field]]: v })}
                endPlaceholder={t('tlOngoing')}
                endSeparator={t('jobEndSep')}
                warn={isYm(job[startField]) && isYm(job[END_FIELD[field]]) && job[END_FIELD[field]] < job[startField]
                  ? t('tlEndBeforeStart')
                  : undefined}
              />
            </div>
          );
        })}

        <MonthField
          label={t('tlAssessDate')}
          value={job.assessmentDate}
          onChange={(v) => onPatch({ assessmentDate: v })}
          note={(() => {
            if (!job.anzsco) return undefined;
            const info = assessingAuthority(job.anzsco);
            if (isYm(job.assessmentDate) && info.validityYears !== null) {
              return t('tlExpiresOn', { authority: info.authority, years: info.validityYears, date: addMonths(job.assessmentDate, info.validityYears * 12) });
            }
            return info.validityYears !== null
              ? t('tlAuthorityNote', { authority: info.authority, years: info.validityYears })
              : info.authority;
          })()}
        />
      </div>

      <div className="mt-3.5">
        <CheckRow
          label={t('pyLabel')}
          checked={job.professionalYear}
          points={professionalYearPoints}
          onToggle={() => onPatch({ professionalYear: !job.professionalYear })}
        />
      </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { pointsTag };
