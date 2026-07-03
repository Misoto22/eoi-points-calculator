'use client';

import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import MonthPicker from './MonthPicker';

interface MonthFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Muted helper line under the field */
  note?: string;
  /** Danger-colored helper line (takes precedence over note) */
  warnNote?: string;
  disabled?: boolean;
  /** Visually hide the label at md+ (a shared column header replaces it) */
  hideLabelOnMd?: boolean;
}

/** Labelled month field — a themed popover picker instead of the native input */
export default function MonthField({ label, value, onChange, note, warnNote, disabled, hideLabelOnMd }: MonthFieldProps) {
  const id = useId();
  const { t } = useTranslation();
  return (
    <div>
      <label htmlFor={id} className={`block text-[11.5px] tracking-[0.16em] font-medium mb-2.5${hideLabelOnMd ? ' md:sr-only' : ''}`} style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <MonthPicker id={id} value={value} onChange={onChange} placeholder={t('tlPickMonth')} disabled={disabled} />
      {(warnNote || note) && (
        <p className="m-0 mt-1.5 text-[11px] leading-[1.5]" style={{ color: warnNote ? 'var(--danger)' : 'var(--muted)' }}>
          {warnNote || note}
        </p>
      )}
    </div>
  );
}
