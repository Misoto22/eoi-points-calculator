// src/components/TimelineChart.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { monthsBetween } from '@/lib/timeline';
import type { TimelineResult } from '@/lib/timeline';
import { MIN_POINTS } from '@/data/pointsCriteria';

interface TimelineChartProps {
  timeline: TimelineResult;
  goal: number;
  today: string;
}

// One step line per assessment, distinguished by dash pattern (monochrome).
// Markers carry only a number; descriptions live in the legend below.
const W = 720, H = 232, PL = 40, PR = 62, TOP = 30, AXIS = 176;
const DASHES: (string | undefined)[] = [undefined, '7 4', '2 3', '9 3 2 3', '1 4'];

export default function TimelineChart({ timeline, goal, today }: TimelineChartProps) {
  const { t } = useTranslation();
  const { startScore, startBases, events, horizonEnd } = timeline;

  const total = Math.max(1, monthsBetween(today, horizonEnd));
  const x = (ym: string) => PL + (monthsBetween(today, ym) / total) * (W - PL - PR);

  const allScores = [...startBases, ...events.flatMap((e) => e.basesAfter), startScore];
  const yMin = Math.min(MIN_POINTS, ...allScores) - 8;
  const yMax = Math.max(goal, ...allScores) + 8;
  const y = (s: number) => AXIS - ((s - yMin) / (yMax - yMin)) * (AXIS - TOP);

  const endX = x(horizonEnd);
  const single = startBases.length === 1;
  const endsAt = new Map(events.filter((e) => e.causes.some((c) => c.kind === 'eligibilityEnd')).map((e) => [e.date, true]));

  // Per-assessment step series: path + own change points + final value
  const series = startBases.map((startBase, i) => {
    let d = `M${PL} ${y(startBase)}`;
    let prevBase = startBase;
    const dots: { ex: number; ey: number; up: boolean }[] = [];
    for (const e of events) {
      const b = e.basesAfter[i];
      if (b !== prevBase) {
        d += ` H${x(e.date)} V${y(b)}`;
        dots.push({ ex: x(e.date), ey: y(b), up: b > prevBase });
        prevBase = b;
      }
    }
    d += ` H${endX}`;
    return { d, dots, finalBase: prevBase, tag: String.fromCharCode(65 + i) };
  });

  // End labels ("A 110"): nudge apart when lines converge
  const endLabels = series
    .map((s, i) => ({ ...s, i, ly: y(s.finalBase) + 4 }))
    .sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].ly - endLabels[i - 1].ly < 12) endLabels[i].ly = endLabels[i - 1].ly + 12;
  }

  const years: string[] = [];
  for (let yr = Number(today.slice(0, 4)) + 1; yr <= Number(horizonEnd.slice(0, 4)); yr++) years.push(String(yr));

  return (
    <div className="mt-[26px] overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('tlChartSummary', { from: today, to: horizonEnd, score: startScore, n: events.length })}
        style={{ minWidth: 560, width: '100%', display: 'block' }}
      >
        {/* goal band + goal / minimum lines */}
        <rect x={PL} y={TOP} width={W - PL - PR} height={Math.max(0, y(goal) - TOP)} fill="var(--ink)" opacity="0.045" />
        <line x1={PL} y1={y(goal)} x2={W - PR} y2={y(goal)} stroke="var(--muted)" strokeWidth="0.75" strokeDasharray="1 5" />
        <text x={W - PR} y={y(goal) - 6} fontSize="10" fill="var(--muted)" textAnchor="end" letterSpacing="1">{t('tlGoalLine', { n: goal })}</text>
        <line x1={PL} y1={y(MIN_POINTS)} x2={W - PR} y2={y(MIN_POINTS)} stroke="var(--hair)" strokeWidth="0.75" strokeDasharray="1 5" />
        <text x={W - PR} y={y(MIN_POINTS) + 14} fontSize="10" fill="var(--muted)" textAnchor="end" letterSpacing="1">{t('tlMinLine', { n: MIN_POINTS })}</text>

        {/* today hairline + start score (single-assessment only — lines carry it otherwise) */}
        <line x1={PL} y1={TOP} x2={PL} y2={AXIS} stroke="var(--hair)" strokeWidth="1" />
        <text x={PL} y={TOP - 10} fontSize="10" fill="var(--muted)" letterSpacing="2">{t('tlToday')}</text>
        {single && (
          <text x={PL + 12} y={y(startBases[0]) - 8} fontSize="17" fontFamily="var(--font-serif)" fill="var(--ink)">{startBases[0]}</text>
        )}

        {/* one step line per assessment */}
        {series.map((s, i) => (
          <g key={s.tag}>
            <path d={s.d} fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeDasharray={DASHES[i % DASHES.length]} />
            {s.dots.map((dot, k) => (
              <circle
                key={k}
                cx={dot.ex}
                cy={dot.ey}
                r="3.5"
                fill={dot.up ? 'var(--ink)' : 'none'}
                stroke={dot.up ? 'var(--ink)' : 'var(--danger)'}
                strokeWidth="1.5"
              />
            ))}
          </g>
        ))}

        {/* line-end tags + final values */}
        {endLabels.map((s) => (
          <text key={s.tag} x={endX + 7} y={s.ly} fontSize="12" fontFamily="var(--font-serif)" fill="var(--ink)">
            {s.tag}&nbsp;{s.finalBase}
          </text>
        ))}

        {/* event markers: warnings as flags, all numbered in the lane below the axis */}
        {events.map((e, i) => {
          const ex = x(e.date);
          const isEnd = endsAt.has(e.date);
          const danger = e.warning || e.delta < 0 || isEnd;
          return (
            <g key={e.date}>
              {e.warning && (
                <>
                  <line x1={ex} y1={TOP + 24} x2={ex} y2={AXIS} stroke="var(--danger)" strokeWidth="0.75" strokeDasharray="3 3" />
                  <rect x={ex - 4} y={TOP + 16} width="8" height="8" transform={`rotate(45 ${ex} ${TOP + 20})`} fill="none" stroke="var(--danger)" strokeWidth="1.25" />
                </>
              )}
              {isEnd && series.map((s) => (
                <g key={s.tag}>
                  <line x1={ex - 5} y1={y(e.basesAfter[series.indexOf(s)]) - 5} x2={ex + 5} y2={y(e.basesAfter[series.indexOf(s)]) + 5} stroke="var(--danger)" strokeWidth="1.5" />
                  <line x1={ex - 5} y1={y(e.basesAfter[series.indexOf(s)]) + 5} x2={ex + 5} y2={y(e.basesAfter[series.indexOf(s)]) - 5} stroke="var(--danger)" strokeWidth="1.5" />
                </g>
              ))}
              <text x={ex} y={AXIS + 15} fontSize="10.5" fontFamily="var(--font-serif)" textAnchor="middle" fill={danger ? 'var(--danger)' : 'var(--muted)'}>
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* axis + year ticks */}
        <line x1={PL} y1={AXIS} x2={W - PR} y2={AXIS} stroke="var(--ink)" strokeWidth="1" />
        {years.map((yr) => (
          <text key={yr} x={x(`${yr}-01`)} y={H - 4} fontSize="9.5" fill="var(--muted)" opacity="0.7" textAnchor="middle">{yr}</text>
        ))}
      </svg>
    </div>
  );
}
