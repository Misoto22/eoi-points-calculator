import { useTranslation } from 'react-i18next';
import type { Evaluation } from '@/lib/points';
import { PATHWAY_STATUS_LABEL_KEY, findOccupation, pathwayStatus } from '@/lib/points';
import { estimateFees, feeLineItems } from '@/lib/feeEstimate';
import { projectPr191 } from '@/lib/pr191';
import { PR191_INCOME_YEARS_REQUIRED, PR191_VISA_VALIDITY_YEARS } from '@/data/pr191';
import type { JobAssessment, PlanningDates, SharedCriteria } from '@/lib/types';
import { isYm } from '@/lib/types';

interface ReportViewProps {
  evaluation: Evaluation;
  shared: SharedCriteria;
  jobs: JobAssessment[];
  goal: number;
  dates: PlanningDates;
  today: string;
  dateLabel: string;
}

const SHARED_FIELDS = ['age', 'english', 'education', 'partnerStatus'] as const;
const BONUS_FIELDS = ['stem', 'ausStudy', 'regionalStudy', 'communityLanguage'] as const;

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;
const fmtRange = ([lo, hi]: [number, number]) => (lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`);

/**
 * The printable detailed report. Rendered both as the on-screen preview and
 * (via the `.print-report` class + globals.css `@media print` rule) as the
 * only visible content when the user prints / saves as PDF.
 */
export default function ReportView({ evaluation, shared, jobs, goal, dates, today, dateLabel }: ReportViewProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const fee = estimateFees(evaluation, shared);
  const feeItems = feeLineItems(fee, evaluation.best?.code);
  const pr191 = isYm(dates.visa491Grant) ? projectPr191(dates.visa491Grant, today) : null;

  return (
    <div
      className="print-report"
      style={{ background: '#fff', color: '#1a1a1a', padding: '28px', fontFamily: 'var(--font-serif), serif', fontSize: '13px', lineHeight: 1.6 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid #1a1a1a', paddingBottom: '10px', marginBottom: '18px' }}>
        <h1 style={{ fontSize: '18px', margin: 0 }}>{t('title')}</h1>
        <span style={{ fontSize: '11px', color: '#666' }}>{dateLabel}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '22px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#666' }}>{t('totalCaps')}</span>
        <span style={{ fontSize: '26px' }}>{evaluation.bareScore} {t('points')}</span>
      </div>

      <h2 style={{ fontSize: '13px', letterSpacing: '0.08em', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>{t('sharedCaps')}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          {SHARED_FIELDS.map((f) => (
            <tr key={f} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '4px 0', color: '#555' }}>{t(`fields.${f}`)}</td>
              <td style={{ padding: '4px 0' }}>{shared[f] ? t(`options.${f}.${shared[f]}`) : '—'}</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>{evaluation.shared[f]}</td>
            </tr>
          ))}
          {BONUS_FIELDS.map((f) => shared[f] && (
            <tr key={f} style={{ borderBottom: '1px solid #eee' }}>
              <td colSpan={2} style={{ padding: '4px 0', color: '#555' }}>{t(`boxes.${f}`)}</td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>+{evaluation.shared[f]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: '13px', letterSpacing: '0.08em', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>{t('sections.jobs')}</h2>
      {evaluation.jobs.map((je, i) => {
        const occ = findOccupation(jobs[i]?.anzsco ?? '');
        const tag = String.fromCharCode(65 + i);
        return (
          <div key={jobs[i]?.id ?? i} style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {tag} · {occ ? `${lang === 'zh' ? occ.zh : occ.en} (${occ.anzsco}, ${occ.list})` : t('noOccName')}
            </div>
            {occ && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {(['189', '190', '491'] as const).map((code) => {
                    const p = je.pathways.find((pw) => pw.code === code);
                    if (!p) return null;
                    return (
                      <tr key={code} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '3px 0', color: '#555' }}>{code}</td>
                        <td style={{ padding: '3px 0' }}>{t(`pathNoteByCode.${code}`)}</td>
                        <td style={{ padding: '3px 0' }}>{t(PATHWAY_STATUS_LABEL_KEY[pathwayStatus(p)])}</td>
                        <td style={{ padding: '3px 0', textAlign: 'right' }}>{p.total} {t('points')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      <h2 style={{ fontSize: '13px', letterSpacing: '0.08em', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>{t('sections.fees')}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          {feeItems.map((it, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '4px 0', color: '#555' }}>
                {t(it.labelKey, it.labelParams)}
                {it.noteKey && <div style={{ fontSize: '10px', color: '#888' }}>{t(it.noteKey)}</div>}
              </td>
              <td style={{ padding: '4px 0', textAlign: 'right' }}>{fmtRange([it.amountLow, it.amountHigh])}</td>
            </tr>
          ))}
          {feeItems.length > 0 && (
            <tr>
              <td style={{ padding: '6px 0', fontWeight: 600 }}>{t('feesTotal')}</td>
              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>{fmtRange([fee.totalLow, fee.totalHigh])}</td>
            </tr>
          )}
        </tbody>
      </table>

      {isYm(dates.visa491Grant) && (
        <>
          <h2 style={{ fontSize: '13px', letterSpacing: '0.08em', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>{t('sections.pr191')}</h2>
          <p style={{ marginTop: '8px', marginBottom: '20px' }}>
            {pr191?.isEligibleNow
              ? t('pr191EligibleNow')
              : pr191 && t('pr191EligibleFrom', { date: pr191.eligibleFrom, n: pr191.monthsRemaining })}
            {' '}{t('pr191ReqIncome', { n: PR191_INCOME_YEARS_REQUIRED, validity: PR191_VISA_VALIDITY_YEARS })}
          </p>
        </>
      )}

      <p style={{ marginTop: '20px', fontSize: '11px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
        {t('cardGoal')}: {goal} {t('points')} · {t('disclaimer')}
      </p>
    </div>
  );
}
