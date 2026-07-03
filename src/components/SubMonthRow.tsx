'use client';

import MonthPicker from './MonthPicker';

interface SubMonthRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Optional end month (work periods): rendered as "… to [end]" once a start exists */
  endValue?: string;
  onEndChange?: (v: string) => void;
  endPlaceholder?: string;
  /** Separator between the two pickers, e.g. 至 / to */
  endSeparator?: string;
  /** Right-aligned quiet note (e.g. expiry) */
  note?: string;
  /** Right-aligned danger note — wins over note */
  warn?: string;
}

/**
 * A footnote-style month input under its parent field: caps label, inline
 * picker trigger(s), and an optional right-aligned note — one calm line.
 */
export default function SubMonthRow({
  label, value, onChange, placeholder,
  endValue, onEndChange, endPlaceholder, endSeparator,
  note, warn,
}: SubMonthRowProps) {
  const showEnd = onEndChange !== undefined && value !== '';
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-[7px] px-0.5">
      <span className="flex-none text-[0.625rem] tracking-[0.1em]" style={{ color: 'var(--muted)' }}>{label}</span>
      <MonthPicker value={value} onChange={onChange} placeholder={placeholder} inline label={label} />
      {showEnd && (
        <>
          <span className="flex-none text-[0.625rem]" style={{ color: 'var(--muted)' }}>{endSeparator}</span>
          <MonthPicker
            value={endValue ?? ''}
            onChange={onEndChange}
            placeholder={endPlaceholder ?? ''}
            inline
            label={`${label} ${endSeparator ?? ''}`.trim()}
          />
        </>
      )}
      {(warn || note) && (
        <span className="ml-auto text-right text-[0.65625rem] leading-[1.5]" style={{ color: warn ? 'var(--danger)' : 'var(--muted)' }}>
          {warn || note}
        </span>
      )}
    </div>
  );
}
