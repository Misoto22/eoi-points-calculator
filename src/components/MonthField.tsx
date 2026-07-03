'use client';

import { useId } from 'react';

interface MonthFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Muted helper line under the field */
  note?: string;
  /** Danger-colored helper line (takes precedence over note) */
  warnNote?: string;
  disabled?: boolean;
}

/** Month-precision date input styled like the existing form fields */
export default function MonthField({ label, value, onChange, note, warnNote, disabled }: MonthFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[11.5px] tracking-[0.16em] font-medium mb-2.5" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        id={id}
        type="month"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full box-border px-3.5 py-[11px] text-[13.5px] tabular-nums outline-none focus:border-[var(--muted)] disabled:opacity-45"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--hair)',
          color: 'var(--ink)',
          fontFamily: 'inherit',
          colorScheme: 'light dark',
          transition: 'border-color 0.2s ease',
        }}
      />
      {(warnNote || note) && (
        <p className="m-0 mt-1.5 text-[11px] leading-[1.5]" style={{ color: warnNote ? 'var(--danger)' : 'var(--muted)' }}>
          {warnNote || note}
        </p>
      )}
    </div>
  );
}
