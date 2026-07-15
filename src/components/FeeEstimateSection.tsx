'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import type { Evaluation } from '@/lib/points';
import { estimateFees, feeLineItems } from '@/lib/feeEstimate';
import type { SharedCriteria } from '@/lib/types';

interface FeeEstimateSectionProps {
  evaluation: Evaluation;
  shared: SharedCriteria;
}

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;
const fmtRange = ([lo, hi]: [number, number]) => (lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`);

function FeeEstimateSection({ evaluation, shared }: FeeEstimateSectionProps) {
  const { t } = useTranslation();
  const fee = estimateFees(evaluation, shared);
  const hasAnything = fee.visaCharge !== null || fee.assessments.length > 0;
  const items = feeLineItems(fee, evaluation.best?.code);

  return (
    <section className="mt-[72px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.36s backwards' }}>
      <SectionHeading num="06" title={t('sections.fees')} side="COST" />
      <p className="mt-3.5 mb-0 text-[0.78125rem] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
        {t('feesNote')}
      </p>

      {!hasAnything ? (
        <p className="mt-[26px] mb-0 text-[0.78125rem]" style={{ color: 'var(--muted)' }}>{t('feesEmpty')}</p>
      ) : (
        <>
          <div className="mt-[22px]">
            {items.map((it, i) => (
              <div
                key={i}
                className="grid gap-4 py-[11px] items-baseline"
                style={{ gridTemplateColumns: '1fr auto', borderBottom: '1px solid var(--hair-soft)' }}
              >
                <div className="min-w-0">
                  <div className="text-[0.8125rem] leading-[1.5]" style={{ color: 'var(--ink)' }}>{t(it.labelKey, it.labelParams)}</div>
                  {it.noteKey && (
                    <div className="text-xs leading-[1.5] mt-[2px]" style={{ color: 'var(--muted)' }}>{t(it.noteKey)}</div>
                  )}
                </div>
                <span className="text-[0.875rem] tabular-nums whitespace-nowrap" style={{ fontFamily: 'var(--font-serif)' }}>
                  {fmtRange([it.amountLow, it.amountHigh])}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-baseline gap-4 mt-[14px] pt-[14px]" style={{ borderTop: '1px solid var(--ink)' }}>
            <span className="text-[0.78125rem] tracking-[0.1em]" style={{ color: 'var(--muted)' }}>{t('feesTotal')}</span>
            <span className="text-[1.0625rem] tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>
              {fmtRange([fee.totalLow, fee.totalHigh])}
            </span>
          </div>
        </>
      )}

      <p className="mt-3.5 mb-0 text-[0.71875rem] tracking-[0.03em]" style={{ color: 'var(--muted)' }}>
        {t('feesDisclaimer')}
      </p>
    </section>
  );
}

export default memo(FeeEstimateSection);
