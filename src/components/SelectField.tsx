'use client';

import { useId, useRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  points: number;
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: string;
  open: boolean;
  onToggle: () => void;
  onPick: (value: string) => void;
  /** Trigger background: shared section sits on --bg (uses surface), job cards sit on surface (use bg) */
  fieldBg?: 'surface' | 'bg';
  /** When set, the trigger is disabled and this note renders below the field. */
  lockedNote?: string;
}

export function pointsTag(points: number): string {
  return points > 0 ? `+${points}` : '±0';
}

export default function SelectField({
  label, placeholder, options, value, open, onToggle, onPick, fieldBg = 'surface', lockedNote,
}: SelectFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const triggerId = `${id}-trigger`;
  const listId = `${id}-list`;
  const listRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.value === value && value !== '') ?? null;

  const moveOptionFocus = (delta: number) => {
    const opts = listRef.current
      ? Array.from(listRef.current.querySelectorAll<HTMLButtonElement>('[role="option"]'))
      : [];
    if (!opts.length) return;
    const idx = opts.indexOf(document.activeElement as HTMLButtonElement);
    const next = idx < 0
      ? (delta > 0 ? 0 : opts.length - 1)
      : Math.min(Math.max(idx + delta, 0), opts.length - 1);
    opts[next].focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    if (!open) onToggle();
    // The list renders on the next commit; move focus once it exists
    requestAnimationFrame(() => moveOptionFocus(e.key === 'ArrowDown' ? 1 : -1));
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    moveOptionFocus(e.key === 'ArrowDown' ? 1 : -1);
  };

  return (
    <div data-dd="true" className="relative">
      <label
        id={labelId}
        className="block text-[11.5px] tracking-[0.16em] font-medium mb-2.5"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </label>
      <button
        type="button"
        id={triggerId}
        aria-labelledby={`${labelId} ${triggerId}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        disabled={!!lockedNote}
        aria-disabled={!!lockedNote}
        onClick={(e) => { if (lockedNote) return; e.stopPropagation(); onToggle(); }}
        onKeyDown={(e) => { if (lockedNote) return; onTriggerKeyDown(e); }}
        className="w-full flex justify-between items-center gap-3 px-3.5 py-[13px] cursor-pointer text-left hover:border-[var(--muted)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--muted)] focus-visible:outline-offset-2 disabled:cursor-default"
        style={{
          background: fieldBg === 'surface' ? 'var(--surface)' : 'var(--bg)',
          border: `1px solid ${open ? 'var(--muted)' : 'var(--hair)'}`,
          color: 'inherit',
          transition: 'border-color 0.2s ease, background 0.2s ease',
        }}
      >
        <span
          className="text-[13.5px] leading-[1.4]"
          style={{ color: selected ? 'var(--ink)' : 'var(--muted)' }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-2.5 flex-none">
          <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
            {selected ? `+${selected.points}` : ''}
          </span>
          {!lockedNote && (
            <svg
              width="10" height="6" viewBox="0 0 10 6" fill="none"
              style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
          )}
        </span>
      </button>
      {lockedNote && (
        <p className="m-0 mt-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>{lockedNote}</p>
      )}
      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          onKeyDown={onListKeyDown}
          className="absolute z-50 left-0 right-0 max-h-[296px] overflow-auto"
          style={{
            top: 'calc(100% + 6px)',
            background: 'var(--surface)',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow)',
            animation: 'eoiDropIn 0.18s ease backwards',
          }}
        >
          {options.map((o) => (
            <button
              key={o.value || '_none'}
              type="button"
              role="option"
              aria-selected={value === o.value && o.value !== ''}
              onClick={() => onPick(o.value)}
              className="flex w-full justify-between items-baseline gap-4 px-3.5 py-3 cursor-pointer text-[13px] text-left leading-[1.45] hover:bg-[var(--hover)]"
              style={{
                background: value === o.value && o.value !== '' ? 'var(--hover)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--hair-soft)',
                color: 'var(--ink)',
              }}
            >
              <span>{o.label}</span>
              <span className="flex-none text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                {pointsTag(o.points)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
