'use client';

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
}

export function pointsTag(points: number): string {
  return points > 0 ? `+${points}` : '±0';
}

export default function SelectField({
  label, placeholder, options, value, open, onToggle, onPick, fieldBg = 'surface',
}: SelectFieldProps) {
  const selected = options.find((o) => o.value === value && value !== '') ?? null;

  return (
    <div data-dd="true" className="relative">
      <label
        className="block text-[11.5px] tracking-[0.16em] font-medium mb-2.5"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </label>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-full flex justify-between items-center gap-3 px-3.5 py-[13px] cursor-pointer text-left hover:border-[var(--muted)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--muted)] focus-visible:outline-offset-2"
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
          <svg
            width="10" height="6" viewBox="0 0 10 6" fill="none"
            style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          className="absolute z-50 left-0 right-0 max-h-[296px] overflow-auto"
          style={{
            top: 'calc(100% + 6px)',
            background: 'var(--surface)',
            border: '1px solid var(--hair)',
            boxShadow: 'var(--shadow)',
            animation: 'eoiDropIn 0.18s ease both',
          }}
        >
          {options.map((o) => (
            <button
              key={o.value || '_none'}
              type="button"
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
