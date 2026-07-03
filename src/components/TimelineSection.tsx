'use client';

import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import MonthField from './MonthField';
import { addMonths, groupCauses, monthsBetween, naatiExpiryMonth } from '@/lib/timeline';
import type { TimelineResult } from '@/lib/timeline';
import TimelineChart from './TimelineChart';
import type { JobAssessment, PlanningDates } from '@/lib/types';
import { isYm } from '@/lib/types';
import { assessingAuthority } from '@/data/assessingAuthorities';
import { findOccupation } from '@/lib/points';

interface TimelineSectionProps {
  dates: PlanningDates;
  onDatesPatch: (patch: Partial<PlanningDates>) => void;
  jobs: JobAssessment[];
  onJobPatch: (id: string, patch: Partial<JobAssessment>) => void;
  naatiChecked: boolean;
  timeline: TimelineResult;
  goal: number;
  today: string;
}

export default function TimelineSection({
  dates, onDatesPatch, jobs, onJobPatch, naatiChecked, timeline, goal, today,
}: TimelineSectionProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';

  const invalidNote = (v: string) => (v && !isYm(v) ? t('tlInvalidDate') : undefined);

  const hasAnyDate = isYm(dates.birth) || isYm(dates.englishTest)
    || jobs.some((j) => isYm(j.ausWorkStart) || isYm(j.overseasWorkStart) || isYm(j.assessmentDate));

  // Future birth or an implied age under 18 both invalidate the derivation
  const birthWarn = isYm(dates.birth)
    ? (dates.birth >= today ? t('tlFutureBirth')
      : monthsBetween(dates.birth, today) < 18 * 12 ? t('tlUnder18') : undefined)
    : undefined;
  const englishNote = isYm(dates.englishTest)
    ? t('tlEnglishExpires', { date: addMonths(dates.englishTest, 36) })
    : undefined;

  // NAATI note logic per amendment: disabled → hint; enabled + valid date → expiry warn; otherwise no note
  const naatiWarnNote = naatiChecked && isYm(dates.naatiCert)
    ? t('tlNaatiExpires', { date: naatiExpiryMonth(dates.naatiCert) })
    : undefined;
  const naatiNote = !naatiChecked ? t('tlNaatiHint') : undefined;

  return (
    <section className="mt-[72px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.28s backwards' }}>
      <SectionHeading num="04" title={t('sections.timeline')} side="TIMELINE" />
      <p className="mt-3.5 mb-0 text-[12.5px] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
        {t('tlNote')}
      </p>

      <div className="grid gap-x-9 gap-y-[22px] mt-[26px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
        <MonthField label={t('tlBirth')} value={dates.birth} onChange={(v) => onDatesPatch({ birth: v })} warnNote={invalidNote(dates.birth) ?? birthWarn} />
        <MonthField label={t('tlEnglishTest')} value={dates.englishTest} onChange={(v) => onDatesPatch({ englishTest: v })} warnNote={invalidNote(dates.englishTest) ?? englishNote} />
        <MonthField
          label={t('tlNaatiCert')}
          value={dates.naatiCert}
          onChange={(v) => onDatesPatch({ naatiCert: v })}
          disabled={!naatiChecked}
          warnNote={invalidNote(dates.naatiCert) ?? naatiWarnNote}
          note={naatiNote}
        />
      </div>

      {/* Column headers once (md+); on narrow screens each field keeps its own label */}
      <div className="hidden md:grid gap-x-9 grid-cols-3 mt-[26px]">
        {[t('tlAusStart'), t('tlOvsStart'), t('tlAssessDate')].map((l) => (
          <span key={l} className="text-[11.5px] tracking-[0.16em] font-medium" style={{ color: 'var(--muted)' }}>{l}</span>
        ))}
      </div>

      {jobs.map((j, i) => {
        const info = assessingAuthority(j.anzsco);
        const occ = findOccupation(j.anzsco);
        // Note under the assessment field: expiry once a date is set, otherwise
        // the occupation's authority + validity so the mapping is visible upfront.
        const assessNote = !j.anzsco
          ? undefined
          : isYm(j.assessmentDate) && info.validityYears !== null
            ? t('tlExpiresOn', { authority: info.authority, years: info.validityYears, date: addMonths(j.assessmentDate, info.validityYears * 12) })
            : info.validityYears !== null
              ? t('tlAuthorityNote', { authority: info.authority, years: info.validityYears })
              : info.authority;
        return (
          <div key={j.id} className="mt-3 pt-3" style={{ borderTop: '1px solid var(--hair-soft)' }}>
            {/* Which assessment this row belongs to — tag + occupation */}
            <div className="flex items-baseline gap-2.5 mb-2.5 min-w-0">
              <span className="text-[15px] leading-none flex-none" style={{ fontFamily: 'var(--font-serif)' }}>
                {String.fromCharCode(65 + i)}
              </span>
              {occ ? (
                <>
                  <span className="text-xs tabular-nums flex-none" style={{ color: 'var(--muted)' }}>{occ.anzsco}</span>
                  <span className="text-[12.5px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--ink-soft)' }}>
                    {lang === 'zh' ? occ.zh : occ.en}
                  </span>
                </>
              ) : (
                <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('noOccName')}</span>
              )}
            </div>
            <div className="grid gap-x-9 gap-y-[18px] grid-cols-1 sm:grid-cols-2 md:grid-cols-3 pb-2">
              <MonthField label={t('tlAusStart')} hideLabelOnMd value={j.ausWorkStart} onChange={(v) => onJobPatch(j.id, { ausWorkStart: v })} warnNote={invalidNote(j.ausWorkStart)} />
              <MonthField label={t('tlOvsStart')} hideLabelOnMd value={j.overseasWorkStart} onChange={(v) => onJobPatch(j.id, { overseasWorkStart: v })} warnNote={invalidNote(j.overseasWorkStart)} />
              <MonthField label={t('tlAssessDate')} hideLabelOnMd value={j.assessmentDate} onChange={(v) => onJobPatch(j.id, { assessmentDate: v })} warnNote={invalidNote(j.assessmentDate)} note={assessNote} />
            </div>
          </div>
        );
      })}

      {!hasAnyDate && (
        <p className="mt-[26px] mb-0 text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('tlEmpty')}</p>
      )}
      {/* Over-45: ineligible — show note instead of chart */}
      {isYm(dates.birth) && monthsBetween(dates.birth, today) >= 45 * 12 ? (
        <p className="mt-[26px] mb-0 text-[12.5px]" style={{ color: 'var(--danger)' }}>{t('tlOver45')}</p>
      ) : (
        <>
          {hasAnyDate && timeline.events.length > 0 && (
            <>
              <TimelineChart timeline={timeline} goal={goal} today={today} />
              {/* Event legend: numbers match the chart markers; identical causes
                  across assessments are merged with their tags (A · B · C). */}
              <ol className="m-0 mt-2 p-0 list-none">
                {timeline.events.map((e, i) => {
                  const isEnd = e.causes.some((c) => c.kind === 'eligibilityEnd');
                  const danger = e.warning || e.delta < 0 || isEnd;
                  const label = groupCauses(e.causes)
                    .map((g) => `${g.jobTags.length ? `${g.jobTags.join(' · ')} ` : ''}${t(g.labelKey, g.params)}`)
                    .join('　');
                  return (
                    <li
                      key={e.date}
                      className="grid items-baseline gap-x-3.5 py-[9px] text-[13px]"
                      style={{ gridTemplateColumns: '20px 62px 1fr auto auto', borderBottom: '1px solid var(--hair-soft)' }}
                    >
                      <span className="text-[13px]" style={{ fontFamily: 'var(--font-serif)', color: danger ? 'var(--danger)' : 'var(--muted)' }}>{i + 1}</span>
                      <span className="text-xs tabular-nums" style={{ color: danger ? 'var(--danger)' : 'var(--muted)' }}>{e.date}</span>
                      <span className="leading-[1.55] min-w-0" style={{ color: danger ? 'var(--danger)' : 'var(--ink)' }}>{label}</span>
                      <span className="text-[13px] tabular-nums" style={{ fontFamily: 'var(--font-serif)', color: danger ? 'var(--danger)' : 'var(--ink)' }}>
                        {e.warning ? '⚠' : `${e.delta > 0 ? '+' : ''}${e.delta}`}
                      </span>
                      <span className="text-[14px] tabular-nums text-right min-w-8" style={{ fontFamily: 'var(--font-serif)' }}>
                        {e.warning ? '' : e.scoreAfter}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
          {hasAnyDate && timeline.events.length === 0 && (
            <p className="mt-[26px] mb-0 text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('tlEmpty')}</p>
          )}
        </>
      )}
    </section>
  );
}
