'use client';

import { useTranslation } from 'react-i18next';
import type { FormData } from '@/lib/types';

interface Props {
  formData: FormData;
  totalPoints: number;
}

export default function VisaEligibility({ formData, totalPoints }: Props) {
  const { t } = useTranslation();

  const visas = [
    {
      code: '189',
      eligible: totalPoints >= 65 && !formData.stateNomination && !formData.regionalNomination,
    },
    {
      code: '190',
      eligible: totalPoints >= 65 && formData.stateNomination,
    },
    {
      code: '491',
      eligible: totalPoints >= 65 && formData.regionalNomination,
    },
  ];

  return (
    <div>
      <h3
        className="text-xs font-medium tracking-wide uppercase mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('visa.title')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {visas.map((visa) => (
          <div
            key={visa.code}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border transition-colors duration-150"
            style={{
              borderColor: visa.eligible ? 'var(--accent)' : 'var(--border-primary)',
              backgroundColor: visa.eligible ? 'var(--accent-muted)' : 'transparent',
              color: visa.eligible ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <span className="font-medium">{visa.code}</span>
            <span>{t(`visa.${visa.code}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
