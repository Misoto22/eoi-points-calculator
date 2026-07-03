'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isYm } from '@/lib/types';

interface MonthPickerProps {
  /** Trigger element id so an external <label htmlFor> can target it */
  id?: string;
  value: string;               // YYYY-MM or ''
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  /** Borderless footnote-style trigger for sub-rows under a parent field */
  inline?: boolean;
}

const MONTH_COUNT = 12;

/** Localized short month names via Intl — no i18n keys needed */
function monthNames(lang: string): string[] {
  const fmt = new Intl.DateTimeFormat(lang.startsWith('zh') ? 'zh-CN' : 'en', { month: 'short' });
  return Array.from({ length: MONTH_COUNT }, (_, i) => fmt.format(new Date(2000, i, 1)));
}

/**
 * Editorial month picker: year stepper + 12-month grid in a hairline popover.
 * Emits YYYY-MM strings; replaces the browser-native month input.
 */
export default function MonthPicker({ id, value, onChange, placeholder, disabled, inline }: MonthPickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [editingYear, setEditingYear] = useState(false);
  const [yearDraft, setYearDraft] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const valid = isYm(value);
  const selYear = valid ? Number(value.slice(0, 4)) : null;
  const selMonth = valid ? Number(value.slice(5, 7)) : null;
  const names = monthNames(i18n.language ?? 'en');

  const openPicker = () => {
    setViewYear(selYear ?? new Date().getFullYear());
    setEditingYear(false);
    setOpen(true);
  };

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    setEditingYear(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Outside click / Escape close while open
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(true); }
    };
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, close]);

  const pick = (month: number) => {
    onChange(`${String(viewYear).padStart(4, '0')}-${String(month).padStart(2, '0')}`);
    close(true);
  };

  const commitYearDraft = () => {
    const y = Number(yearDraft);
    if (Number.isInteger(y) && y >= 1900 && y <= 2100) setViewYear(y);
    setEditingYear(false);
  };

  const stepBtn = 'cursor-pointer px-3 py-1 text-[13px] leading-none hover:text-[var(--ink)]';
  const footBtn = 'cursor-pointer text-[11px] tracking-[0.08em] py-1 px-1 hover:text-[var(--ink)]';

  return (
    <div ref={rootRef} className={inline ? 'relative inline-block max-w-full' : 'relative'}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close(false) : openPicker())}
        className={inline
          ? 'box-border flex items-baseline gap-1.5 px-0 py-0.5 cursor-pointer text-left text-[12.5px] disabled:opacity-45 disabled:cursor-default focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--muted)] focus-visible:outline-offset-2'
          : 'w-full box-border flex justify-between items-center gap-2 px-3.5 py-[11px] text-[13.5px] cursor-pointer text-left disabled:opacity-45 disabled:cursor-default hover:border-[var(--muted)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--muted)] focus-visible:outline-offset-2'}
        style={inline
          ? { background: 'none', border: 'none', color: 'var(--ink)' }
          : {
              background: 'var(--bg)',
              border: `1px solid ${open ? 'var(--muted)' : 'var(--hair)'}`,
              color: 'var(--ink)',
              transition: 'border-color 0.2s ease',
            }}
      >
        {valid ? (
          <span
            className="tabular-nums"
            style={{
              fontFamily: 'var(--font-serif)',
              ...(inline ? { borderBottom: '1px dotted var(--muted)', paddingBottom: 1 } : {}),
            }}
          >
            {value.slice(0, 4)}&nbsp;·&nbsp;{value.slice(5, 7)}
          </span>
        ) : (
          <span
            style={{
              color: 'var(--muted)',
              opacity: 0.75,
              ...(inline ? { borderBottom: '1px dotted var(--hair)', paddingBottom: 1 } : {}),
            }}
          >
            {placeholder}
          </span>
        )}
        {valid && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(e) => { e.stopPropagation(); onChange(''); close(false); }}
            className="text-[14px] leading-none px-1 hover:text-[var(--danger)]"
            style={{ color: 'var(--muted)' }}
          >
            ×
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={placeholder}
          className="absolute z-50 left-0 w-[248px]"
          style={{
            top: 'calc(100% + 6px)',
            background: 'var(--surface)',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow)',
            animation: 'eoiDropIn 0.18s ease backwards',
          }}
        >
          <div
            className="flex justify-between items-center px-1.5 py-1.5"
            style={{ borderBottom: '1px solid var(--hair-soft)' }}
          >
            <button type="button" aria-label="Previous year" onClick={() => setViewYear((y) => y - 1)} className={stepBtn} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>‹</button>
            {editingYear ? (
              <input
                autoFocus
                inputMode="numeric"
                value={yearDraft}
                onChange={(e) => setYearDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onBlur={commitYearDraft}
                onKeyDown={(e) => { if (e.key === 'Enter') commitYearDraft(); }}
                className="w-16 text-center text-[16px] tabular-nums outline-none"
                style={{ fontFamily: 'var(--font-serif)', background: 'var(--bg)', border: '1px solid var(--hair)', color: 'var(--ink)', padding: '1px 0' }}
              />
            ) : (
              <button
                type="button"
                onClick={() => { setYearDraft(String(viewYear)); setEditingYear(true); }}
                className="cursor-pointer text-[15px] tracking-[0.06em] tabular-nums px-2 py-0.5 hover:bg-[var(--hover)]"
                style={{ fontFamily: 'var(--font-serif)', background: 'none', border: 'none', color: 'var(--ink)' }}
              >
                {viewYear}
              </button>
            )}
            <button type="button" aria-label="Next year" onClick={() => setViewYear((y) => y + 1)} className={stepBtn} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>›</button>
          </div>

          <div className="grid grid-cols-4">
            {names.map((name, i) => {
              const m = i + 1;
              const selected = viewYear === selYear && m === selMonth;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pick(m)}
                  className="cursor-pointer text-[12px] py-[9px] text-center hover:bg-[var(--hover)]"
                  style={{
                    background: selected ? 'var(--ink)' : 'transparent',
                    color: selected ? 'var(--bg)' : 'var(--ink-soft)',
                    border: 'none',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div
            className="flex justify-between items-center px-2.5 py-[7px]"
            style={{ borderTop: '1px solid var(--hair-soft)' }}
          >
            <button type="button" onClick={() => { onChange(''); close(true); }} className={footBtn} style={{ background: 'none', border: 'none', color: 'var(--muted)' }}>
              {t('tlClear')}
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                close(true);
              }}
              className={footBtn}
              style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
            >
              {t('tlThisMonth')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
