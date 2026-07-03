'use client';

import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import SelectField, { pointsTag } from './SelectField';
import CheckRow from './CheckRow';
import type { JobAssessment } from '@/lib/types';
import type { JobEvaluation } from '@/lib/points';
import type { Occupation } from '@/data/occupations';
import { occupations } from '@/data/occupations';
import { jobSelectCriteria, professionalYearPoints } from '@/data/pointsCriteria';
import type { JobSelectField } from '@/data/pointsCriteria';

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
}

export function occupationDisplayName(occ: Occupation | null, lang: string): string {
  if (!occ) return '';
  return lang === 'zh' ? `${occ.zh} · ${occ.en}` : occ.en;
}

const MAX_RESULTS = 8;
const SELECT_FIELDS: JobSelectField[] = ['ausWork', 'overseasWork'];

const listTagStyle = {
  fontSize: '10px',
  letterSpacing: '0.1em',
  color: 'var(--muted)',
  border: '1px solid var(--hair)',
  padding: '2px 7px',
} as const;

export default function JobCard({
  job, evaluation, canRemove, ui, onPatch, onUIPatch, onRemove, openSelect, setOpenSelect,
  ausWorkLocked, overseasWorkLocked,
}: JobCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const searchId = useId();
  const searchListId = `${searchId}-list`;

  const occ = evaluation.occupation;
  const tag = String.fromCharCode(65 + evaluation.index);
  const q = ui.q.trim().toLowerCase();
  const filtered = q
    ? occupations.filter((o) =>
        o.anzsco.includes(q) || o.en.toLowerCase().includes(q) || o.zh.includes(ui.q.trim()))
    : occupations;
  const showDisplay = !!occ && !ui.open;
  const showSearch = !occ || ui.open;
  const cardActive = ui.open || !!openSelect?.startsWith(`${job.id}:`);

  return (
    <div
      className="mt-[22px] relative"
      style={{
        border: '1px solid var(--hair)',
        background: 'var(--surface)',
        padding: 'clamp(18px, 3.4vw, 28px)',
        zIndex: cardActive ? 30 : 1,
        animation: 'eoiFadeUp 0.4s ease backwards',
      }}
    >
      <div className="flex justify-between items-baseline gap-3.5">
        <div className="flex items-baseline gap-3">
          <span className="text-[19px] leading-none" style={{ fontFamily: 'var(--font-serif)' }}>{tag}</span>
          <span className="text-[11.5px] tracking-[0.16em] font-medium" style={{ color: 'var(--muted)' }}>
            {t('jobCaps')}
          </span>
        </div>
        <div className="flex items-baseline gap-3.5">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {t('jobSubtotal')}&nbsp;
            <span className="text-base tabular-nums" style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>
              {evaluation.base}
            </span>
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              title={t('removeJob')}
              aria-label={t('removeJob')}
              className="cursor-pointer text-[17px] leading-none w-8 h-8 -my-2 flex items-center justify-center hover:text-[var(--danger)]"
              style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Occupation: searchable dropdown */}
      <div data-dd="true" className="relative mt-[18px]">
        <label
          htmlFor={searchId}
          className="block text-[11.5px] tracking-[0.16em] font-medium mb-2.5"
          style={{ color: 'var(--muted)' }}
        >
          {t('jobField')}
        </label>
        {showDisplay && occ && (
          <div className="flex items-stretch" style={{ border: '1px solid var(--hair)', background: 'var(--bg)' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUIPatch({ open: true, q: '' }); }}
              className="flex-1 flex items-baseline gap-3 px-3.5 py-[13px] cursor-pointer text-left min-w-0 hover:bg-[var(--hover)]"
              style={{ background: 'none', border: 'none', color: 'inherit' }}
            >
              <span className="text-xs tabular-nums flex-none" style={{ color: 'var(--muted)' }}>{occ.anzsco}</span>
              <span className="text-[13.5px] leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap">
                {occupationDisplayName(occ, lang)}
              </span>
              <span className="flex-none" style={listTagStyle}>{occ.list}</span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPatch({ anzsco: '' }); onUIPatch({ open: false, q: '' }); }}
              title={t('clearOcc')}
              aria-label={t('clearOcc')}
              className="cursor-pointer text-[15px] px-4 hover:text-[var(--danger)]"
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
            placeholder={t('jobSearch')}
            className="w-full box-border px-3.5 py-[13px] text-[13.5px] outline-none focus:border-[var(--muted)]"
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
            id={searchListId}
            role="listbox"
            className="absolute z-50 left-0 right-0 max-h-[296px] overflow-auto"
            style={{
              top: 'calc(100% + 6px)',
              background: 'var(--surface)',
              border: '1px solid var(--hair)',
              boxShadow: 'var(--shadow)',
              animation: 'eoiDropIn 0.18s ease backwards',
            }}
          >
            {filtered.slice(0, MAX_RESULTS).map((o) => (
              <button
                key={o.anzsco}
                type="button"
                role="option"
                aria-selected={job.anzsco === o.anzsco}
                onClick={() => { onPatch({ anzsco: o.anzsco }); onUIPatch({ open: false, q: '' }); }}
                className="grid items-baseline gap-3 w-full px-3.5 py-3 cursor-pointer text-[13px] text-left leading-[1.45] hover:bg-[var(--hover)]"
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
            {filtered.length === 0 && (
              <p className="m-0 p-3.5 text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('occNo')}</p>
            )}
            <div
              className="px-3.5 py-[9px] text-[11px] tracking-[0.05em]"
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
          // Derive lock state per field from parent-provided booleans
          const locked = field === 'ausWork' ? ausWorkLocked : field === 'overseasWork' ? overseasWorkLocked : false;
          return (
            <SelectField
              key={field}
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
          );
        })}
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
  );
}

export { pointsTag };
