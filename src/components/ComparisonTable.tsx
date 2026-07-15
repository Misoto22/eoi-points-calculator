'use client';

import { memo } from 'react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { Evaluation } from '@/lib/points';
import { bestPathwayForJob, hasOccupation } from '@/lib/points';
import HScrollFade from './HScrollFade';

interface ComparisonTableProps {
  evaluation: Evaluation;
}

const TH_STYLE: CSSProperties = {
  textAlign: 'left',
  fontWeight: 500,
  padding: '0 10px 8px 0',
  color: 'var(--muted)',
};
const TD_STYLE: CSSProperties = { padding: '9px 10px 9px 0', verticalAlign: 'baseline' };

/** Side-by-side summary once 2+ occupations are entered — best pathway, points and states at a glance. */
function ComparisonTable({ evaluation }: ComparisonTableProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const rows = evaluation.jobs.filter(hasOccupation);

  if (rows.length < 2) return null;

  return (
    <div className="mt-[22px] mb-[6px]">
      <div className="text-[0.71875rem] tracking-[0.16em] font-medium mb-2.5" style={{ color: 'var(--muted)' }}>
        {t('compareTitle')}
      </div>
      <HScrollFade>
      <table className="w-full text-[0.8125rem]" style={{ borderCollapse: 'collapse', minWidth: '520px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--ink)' }}>
            <th style={{ ...TH_STYLE, width: '22px' }}>{t('compareTag')}</th>
            <th style={TH_STYLE}>{t('compareOcc')}</th>
            <th style={TH_STYLE}>{t('compareList')}</th>
            <th style={TH_STYLE}>{t('compareBest')}</th>
            <th style={TH_STYLE}>{t('compareStates')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((je) => {
            const tag = String.fromCharCode(65 + je.index);
            const best = bestPathwayForJob(je);
            const occ = je.occupation;
            return (
              <tr key={je.job.id} style={{ borderBottom: '1px solid var(--hair-soft)' }}>
                <td style={{ ...TD_STYLE, fontFamily: 'var(--font-serif)' }}>{tag}</td>
                <td style={TD_STYLE}>
                  {lang === 'zh' ? occ.zh : occ.en}
                  <span className="tabular-nums" style={{ color: 'var(--muted)' }}> · {occ.anzsco}</span>
                </td>
                <td style={{ ...TD_STYLE, color: 'var(--muted)' }}>{occ.list}</td>
                <td style={{ ...TD_STYLE, fontFamily: 'var(--font-serif)' }}>
                  {best ? `${best.code} · ${best.total} ${t('points')}` : <span style={{ color: 'var(--muted)', fontFamily: 'inherit' }}>{t('compareNone')}</span>}
                </td>
                <td style={{ ...TD_STYLE, color: 'var(--muted)' }}>
                  {best && best.states.length > 0 ? best.states.join(' · ') : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </HScrollFade>
    </div>
  );
}

export default memo(ComparisonTable);
