'use client';

import { useTranslation } from 'react-i18next';

interface FloatingChipProps {
  visible: boolean;
  total: number;
  onClick: () => void;
}

export default function FloatingChip({ visible, total, onClick }: FloatingChipProps) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={t('chipHint')}
      className="fixed right-[22px] z-40 flex items-baseline gap-2.5 px-[18px] py-[11px] cursor-pointer"
      style={{
        bottom: 'calc(22px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--band-bg)',
        color: 'var(--band-ink)',
        border: '1px solid var(--band-border)',
        boxShadow: 'var(--shadow)',
        animation: 'eoiFadeUp 0.35s ease backwards',
      }}
    >
      <span className="text-[0.65625rem] tracking-[0.18em] font-medium" style={{ color: 'var(--band-muted)' }}>
        {t('totalCaps')}
      </span>
      <span className="text-[1.3125rem] leading-none tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
        {total}
      </span>
    </button>
  );
}
