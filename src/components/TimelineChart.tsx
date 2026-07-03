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

const W = 720, H = 268, PL = 40, PR = 30, TOP = 30, AXIS = 176;

export default function TimelineChart({ timeline, goal, today }: TimelineChartProps) {
  const { t } = useTranslation();
  const { startScore, events, horizonEnd, endsAt45 } = timeline;

  const total = Math.max(1, monthsBetween(today, horizonEnd));
  const x = (ym: string) => PL + (monthsBetween(today, ym) / total) * (W - PL - PR);

  const scores = [startScore, ...events.map((e) => e.scoreAfter)];
  const yMin = Math.min(MIN_POINTS, ...scores) - 8;
  const yMax = Math.max(goal, ...scores) + 8;
  const y = (s: number) => AXIS - ((s - yMin) / (yMax - yMin)) * (AXIS - TOP);

  // step path: horizontal to each score event, vertical at the event month
  let d = `M${PL} ${y(startScore)}`;
  for (const e of events) {
    if (e.delta === 0) continue;
    d += ` H${x(e.date)} V${y(e.scoreAfter)}`;
  }
  const endX = x(horizonEnd);
  d += ` H${endX}`;
  const area = `${d} V${AXIS} H${PL} Z`;

  // label collision: alternate rows when neighbours are closer than 72px
  const labelled = events.map((e) => ({ e, lx: x(e.date) }));
  let lastLx = -Infinity, row = 0;
  const rows = labelled.map(({ lx }) => {
    row = lx - lastLx < 72 ? (row + 1) % 2 : 0;
    lastLx = lx;
    return row;
  });

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

        {/* area + step line */}
        <path d={area} fill="var(--ink)" opacity="0.06" />
        <path d={d} fill="none" stroke="var(--ink)" strokeWidth="1.75" />

        {/* today hairline + start score */}
        <line x1={PL} y1={TOP} x2={PL} y2={AXIS} stroke="var(--hair)" strokeWidth="1" />
        <text x={PL} y={TOP - 10} fontSize="10" fill="var(--muted)" letterSpacing="2">{t('tlToday')}</text>
        <text x={PL + 12} y={y(startScore) - 8} fontSize="17" fontFamily="var(--font-serif)" fill="var(--ink)">{startScore}</text>

        {/* events: dots for gains/losses, dashed flag + rotated square for warnings, × for eligibilityEnd */}
        {events.map((e, i) => {
          const ex = x(e.date);
          const rowY = rows[i] * 28;
          const short = e.causes.map((c) => t(c.labelKey, c.params)).join(' · ');
          if (e.warning) {
            return (
              <g key={e.date}>
                <line x1={ex} y1={TOP + 24} x2={ex} y2={AXIS} stroke="var(--danger)" strokeWidth="0.75" strokeDasharray="3 3" />
                <rect x={ex - 4} y={TOP + 16} width="8" height="8" transform={`rotate(45 ${ex} ${TOP + 20})`} fill="none" stroke="var(--danger)" strokeWidth="1.25" />
                <text x={ex} y={AXIS + 22 + rowY} fontSize="9.5" fill="var(--danger)" textAnchor="middle">{e.date}</text>
                <text x={ex} y={AXIS + 36 + rowY} fontSize="10" fill="var(--danger)" textAnchor="middle">{short}</text>
              </g>
            );
          }
          const isEnd = e.causes.some((c) => c.kind === 'eligibilityEnd');
          const ey = y(e.scoreAfter);
          return (
            <g key={e.date}>
              {isEnd ? (
                <>
                  <line x1={ex - 5} y1={ey - 5} x2={ex + 5} y2={ey + 5} stroke="var(--danger)" strokeWidth="1.5" />
                  <line x1={ex - 5} y1={ey + 5} x2={ex + 5} y2={ey - 5} stroke="var(--danger)" strokeWidth="1.5" />
                </>
              ) : (
                <circle cx={ex} cy={ey} r="4" fill={e.delta >= 0 ? 'var(--ink)' : 'none'} stroke={e.delta >= 0 ? 'var(--ink)' : 'var(--danger)'} strokeWidth="1.5" />
              )}
              <text x={ex} y={e.delta >= 0 ? ey - 14 : ey + 24} fontSize="16" fontFamily="var(--font-serif)" fill={e.delta >= 0 ? 'var(--ink)' : 'var(--danger)'} textAnchor="middle">{e.scoreAfter}</text>
              <text x={ex} y={AXIS + 22 + rowY} fontSize="9.5" fill="var(--muted)" textAnchor="middle">{e.date}</text>
              <text x={ex} y={AXIS + 36 + rowY} fontSize="10" fill={e.delta < 0 || isEnd ? 'var(--danger)' : 'var(--ink)'} textAnchor="middle">{short}</text>
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
