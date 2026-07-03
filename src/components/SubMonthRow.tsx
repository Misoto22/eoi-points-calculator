'use client';

import MonthPicker from './MonthPicker';

interface SubMonthRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Right-aligned quiet note (e.g. expiry) */
  note?: string;
  /** Right-aligned danger note — wins over note */
  warn?: string;
}

/**
 * A footnote-style month input under its parent field: caps label, inline
 * picker trigger, and an optional right-aligned note — one calm line.
 */
export default function SubMonthRow({ label, value, onChange, placeholder, note, warn }: SubMonthRowProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-[7px] px-0.5">
      <span className="flex-none text-[10px] tracking-[0.1em]" style={{ color: 'var(--muted)' }}>{label}</span>
      <MonthPicker value={value} onChange={onChange} placeholder={placeholder} inline />
      {(warn || note) && (
        <span className="ml-auto text-right text-[10.5px] leading-[1.5]" style={{ color: warn ? 'var(--danger)' : 'var(--muted)' }}>
          {warn || note}
        </span>
      )}
    </div>
  );
}
