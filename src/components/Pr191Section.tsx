'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import MonthField from './MonthField';
import { isYm } from '@/lib/types';
import type { PlanningDates } from '@/lib/types';
import { projectPr191 } from '@/lib/pr191';
import {
  PR191_APPLICATION_FEE,
  PR191_HOLDING_YEARS,
  PR191_INCOME_YEARS_REQUIRED,
  PR191_VISA_VALIDITY_YEARS,
} from '@/data/pr191';

interface Pr191SectionProps {
  dates: PlanningDates;
  onDatesPatch: (patch: Partial<PlanningDates>) => void;
  today: string;
}

function Pr191Section({ dates, onDatesPatch, today }: Pr191SectionProps) {
  const { t } = useTranslation();
  const projection = isYm(dates.visa491Grant) ? projectPr191(dates.visa491Grant, today) : null;

  return (
    <section className="mt-[72px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.32s backwards' }}>
      <SectionHeading num="07" title={t('sections.pr191')} side="PR PATHWAY" />
      <p className="mt-3.5 mb-0 text-[0.78125rem] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
        {t('pr191Note', { years: PR191_HOLDING_YEARS })}
      </p>

      <div className="mt-[26px] max-w-[290px]">
        <MonthField
          label={t('pr191GrantLabel')}
          value={dates.visa491Grant}
          onChange={(v) => onDatesPatch({ visa491Grant: v })}
        />
      </div>

      <p className="mt-[18px] mb-0 text-[0.8125rem] leading-[1.6]" style={{ color: projection?.isEligibleNow ? 'var(--ink)' : 'var(--ink-soft)' }}>
        {!projection
          ? t('pr191Empty')
          : projection.isEligibleNow
            ? t('pr191EligibleNow')
            : t('pr191EligibleFrom', { date: projection.eligibleFrom, n: projection.monthsRemaining })}
      </p>

      <div className="mt-[22px]" style={{ borderTop: '1px solid var(--hair)' }}>
        <div className="mt-3.5 text-[0.71875rem] tracking-[0.16em] font-medium" style={{ color: 'var(--muted)' }}>
          {t('pr191ReqTitle')}
        </div>
        <ul className="m-0 mt-2.5 pl-[18px] flex flex-col gap-1.5 text-[0.78125rem] leading-[1.6]" style={{ color: 'var(--ink-soft)' }}>
          <li>{t('pr191ReqRegional')}</li>
          <li>{t('pr191ReqIncome', { n: PR191_INCOME_YEARS_REQUIRED, validity: PR191_VISA_VALIDITY_YEARS })}</li>
          <li>{t('pr191ReqHealth')}</li>
        </ul>
        <p className="mt-3 mb-0 text-[0.78125rem] leading-[1.6]" style={{ color: 'var(--ink-soft)' }}>
          {t('pr191Fee', {
            primary: `$${PR191_APPLICATION_FEE.primary}`,
            partner: `$${PR191_APPLICATION_FEE.partner}`,
            child: `$${PR191_APPLICATION_FEE.child}`,
          })}
        </p>
      </div>

      <p className="mt-3.5 mb-0 text-[0.71875rem] tracking-[0.03em]" style={{ color: 'var(--muted)' }}>
        {t('pr191Disclaimer')}
      </p>
    </section>
  );
}

export default memo(Pr191Section);
