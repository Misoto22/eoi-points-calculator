'use client';

import { pointsTag } from './SelectField';

interface CheckRowProps {
  label: string;
  checked: boolean;
  points: number;
  onToggle: () => void;
}

export default function CheckRow({ label, checked, points, onToggle }: CheckRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex items-start gap-3 w-full px-1.5 py-[13px] cursor-pointer text-left hover:bg-[var(--hover)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--muted)] focus-visible:-outline-offset-1"
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--hair)',
        color: 'inherit',
        transition: 'background 0.15s ease',
      }}
    >
      <span
        aria-hidden="true"
        className="w-[15px] h-[15px] flex-none mt-0.5 flex items-center justify-center"
        style={{
          border: '1px solid var(--muted)',
          background: checked ? 'var(--ink)' : 'transparent',
          transition: 'background 0.18s ease, border-color 0.18s ease',
        }}
      >
        {checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5l2.3 2.3L8 1" stroke="var(--bg)" strokeWidth="1.4" fill="none" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-[13.5px] leading-[1.55]">{label}</span>
      <span className="flex-none mt-0.5 text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
        {pointsTag(points)}
      </span>
    </button>
  );
}
