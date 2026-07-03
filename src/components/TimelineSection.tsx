'use client';

import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import MonthField from './MonthField';
import { addMonths, monthsBetween, naatiExpiryMonth } from '@/lib/timeline';
import type { TimelineResult } from '@/lib/timeline';
import TimelineChart from './TimelineChart';
import type { JobAssessment, PlanningDates } from '@/lib/types';
import { isYm } from '@/lib/types';
import { assessingAuthority } from '@/data/assessingAuthorities';

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
  const { t } = useTranslation();

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

      {jobs.map((j, i) => {
        const info = assessingAuthority(j.anzsco);
        const assessNote = isYm(j.assessmentDate) && info.validityYears !== null
          ? t('tlExpiresOn', { authority: info.authority, years: info.validityYears, date: addMonths(j.assessmentDate, info.validityYears * 12) })
          : j.anzsco ? info.authority : undefined;
        return (
          <div
            key={j.id}
            className="grid gap-x-5 gap-y-[18px] mt-[18px] pt-3.5"
            // Tag column stays fixed; fields wrap inside their own grid so a
            // wrapped field can never fall into the narrow tag track.
            style={{ gridTemplateColumns: '26px 1fr', borderTop: '1px solid var(--hair-soft)' }}
          >
            <span className="text-[17px] pt-[26px]" style={{ fontFamily: 'var(--font-serif)' }}>
              {String.fromCharCode(65 + i)}
            </span>
            <div className="grid gap-x-9 gap-y-[18px] items-end" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
              <MonthField label={t('tlAusStart')} value={j.ausWorkStart} onChange={(v) => onJobPatch(j.id, { ausWorkStart: v })} warnNote={invalidNote(j.ausWorkStart)} />
              <MonthField label={t('tlOvsStart')} value={j.overseasWorkStart} onChange={(v) => onJobPatch(j.id, { overseasWorkStart: v })} warnNote={invalidNote(j.overseasWorkStart)} />
              <MonthField label={t('tlAssessDate')} value={j.assessmentDate} onChange={(v) => onJobPatch(j.id, { assessmentDate: v })} warnNote={invalidNote(j.assessmentDate)} note={assessNote} />
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
              <ol className="sr-only">
                {timeline.events.map((e) => (
                  <li key={e.date}>
                    {e.date}: {e.causes.map((c) => t(c.labelKey, c.params)).join(', ')}
                    {e.delta !== 0 ? ` (${e.delta > 0 ? '+' : ''}${e.delta} → ${e.scoreAfter})` : ''}
                  </li>
                ))}
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
