'use client';

import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeading from './SectionHeading';
import { groupCauses, monthsBetween } from '@/lib/timeline';
import type { TimelineResult } from '@/lib/timeline';
import TimelineChart from './TimelineChart';
import type { JobAssessment, PlanningDates } from '@/lib/types';
import { isYm } from '@/lib/types';
import { findOccupation } from '@/lib/points';

interface TimelineSectionProps {
  /** Read-only: all dates are edited next to their source fields (01 / 02) */
  dates: PlanningDates;
  jobs: JobAssessment[];
  timeline: TimelineResult;
  goal: number;
  today: string;
}

function TimelineSection({
  dates, jobs, timeline, goal, today,
}: TimelineSectionProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  // Hovering a legend row highlights the matching marker on the chart
  const [focusEvent, setFocusEvent] = useState<number | null>(null);

  // Stable identity keeps the memoized chart from reconciling on hover
  const seriesLabels = useMemo(() => jobs.map((j) => {
    const occ = findOccupation(j.anzsco);
    return occ ? (lang === 'zh' ? occ.zh : occ.en) : t('noOccName');
  }), [jobs, lang, t]);

  const hasAnyDate = isYm(dates.birth) || isYm(dates.englishTest)
    || jobs.some((j) => isYm(j.ausWorkStart) || isYm(j.overseasWorkStart) || isYm(j.assessmentDate));

  return (
    <section className="mt-[72px]" style={{ animation: 'eoiFadeUp 0.7s ease 0.28s backwards' }}>
      <SectionHeading num="04" title={t('sections.timeline')} side="TIMELINE" />
      <p className="mt-3.5 mb-0 text-[12.5px] leading-[1.7] max-w-[46em]" style={{ color: 'var(--muted)' }}>
        {t('tlNote')}
      </p>

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
              <TimelineChart timeline={timeline} goal={goal} today={today} focusEventIndex={focusEvent} seriesLabels={seriesLabels} />
              {/* Event legend: numbers match the chart markers; identical causes
                  across assessments are merged with their tags (A · B · C). */}
              <ol className="m-0 mt-2 p-0 list-none" onMouseLeave={() => setFocusEvent(null)}>
                {timeline.events.map((e, i) => {
                  const isEnd = e.causes.some((c) => c.kind === 'eligibilityEnd');
                  const danger = e.warning || e.delta < 0 || isEnd;
                  const label = groupCauses(e.causes)
                    .map((g) => `${g.jobTags.length ? `${g.jobTags.join(' · ')} ` : ''}${t(g.labelKey, g.params)}`)
                    .join('　');
                  return (
                    <li
                      key={e.date}
                      onMouseEnter={() => setFocusEvent(i)}
                      className="grid items-baseline gap-x-3.5 py-[9px] text-[13px] hover:bg-[var(--hover)]"
                      style={{ gridTemplateColumns: '20px 62px 1fr auto auto', borderBottom: '1px solid var(--hair-soft)', transition: 'background 0.15s ease' }}
                    >
                      <span className="text-[13px]" style={{ fontFamily: 'var(--font-serif)', color: danger ? 'var(--danger)' : 'var(--muted)' }}>{i + 1}</span>
                      <span className="text-xs tabular-nums" style={{ color: danger ? 'var(--danger)' : 'var(--muted)' }}>{e.date}</span>
                      <span className="leading-[1.55] min-w-0" style={{ color: danger ? 'var(--danger)' : 'var(--ink)' }}>{label}</span>
                      <span className="text-[13px] tabular-nums" style={{ fontFamily: 'var(--font-serif)', color: danger ? 'var(--danger)' : 'var(--ink)' }}>
                        {e.warning ? '⚠' : e.delta === 0 ? '±0' : `${e.delta > 0 ? '+' : ''}${e.delta}`}
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

export default memo(TimelineSection);
