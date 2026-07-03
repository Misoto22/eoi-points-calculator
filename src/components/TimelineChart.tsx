// src/components/TimelineChart.tsx
'use client';

import { memo, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addMonths, monthsBetween } from '@/lib/timeline';
import type { TimelineResult } from '@/lib/timeline';
import { MIN_POINTS } from '@/data/pointsCriteria';

interface TimelineChartProps {
  timeline: TimelineResult;
  goal: number;
  today: string;
  /** Legend-row hover: bolds the matching marker and shows its crosshair */
  focusEventIndex?: number | null;
  /** Occupation names per assessment (index-aligned) for the series key */
  seriesLabels?: string[];
}

// One step line per assessment (monochrome dash variants). Numbers live in a
// lane under the axis; descriptions in the legend below the chart.
const W = 720, H = 238, PL = 40, PR = 62, TOP = 30, AXIS = 182;
const DASHES: (string | undefined)[] = [undefined, '7 4', '2 3', '9 3 2 3', '1 4'];
const DIM = 0.24;

function TimelineChart({ timeline, goal, today, focusEventIndex = null, seriesLabels }: TimelineChartProps) {
  const { t } = useTranslation();
  const { startScore, startBases, events, horizonEnd } = timeline;
  const [hoverM, setHoverM] = useState<number | null>(null);   // months from today
  const [focusLine, setFocusLine] = useState<number | null>(null);
  // BCR is cached per hover session — reading it on every pointermove forces
  // synchronous layout right when frames matter most
  const rectRef = useRef<DOMRect | null>(null);

  const total = Math.max(1, monthsBetween(today, horizonEnd));
  const x = (m: number) => PL + (m / total) * (W - PL - PR);
  const xDate = (ym: string) => x(monthsBetween(today, ym));

  const allScores = [...startBases, ...events.flatMap((e) => e.basesAfter), startScore];
  const yMin = Math.min(MIN_POINTS, ...allScores) - 8;
  const yMax = Math.max(goal, ...allScores) + 8;
  const y = (s: number) => AXIS - ((s - yMin) / (yMax - yMin)) * (AXIS - TOP);

  const endX = x(total);
  const single = startBases.length === 1;

  // Per-line base value at any month offset (step function over events)
  const valueAt = (line: number, m: number): number => {
    let v = startBases[line];
    for (const e of events) {
      if (monthsBetween(today, e.date) > m) break;
      v = e.basesAfter[line];
    }
    return v;
  };

  // Per-assessment step series with rounded corners + own change dots
  const series = useMemo(() => startBases.map((startBase, i) => {
    const R = 2.5; // corner radius keeps steps crisp but not harsh
    let d = `M${PL} ${y(startBase)}`;
    let prevBase = startBase;
    const dots: { ex: number; ey: number; up: boolean }[] = [];
    for (const e of events) {
      const b = e.basesAfter[i];
      if (b === prevBase) continue;
      const ex = xDate(e.date);
      const y0 = y(prevBase), y1 = y(b);
      const dir = y1 > y0 ? 1 : -1;
      d += ` H${ex - R} Q${ex} ${y0} ${ex} ${y0 + dir * R} V${y1 - dir * R} Q${ex} ${y1} ${ex + R} ${y1}`;
      dots.push({ ex, ey: y1, up: b > prevBase });
      prevBase = b;
    }
    d += ` H${endX}`;
    return { d, dots, finalBase: prevBase, tag: String.fromCharCode(65 + i) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [startBases, events, horizonEnd, yMin, yMax]);

  // Layered soft areas (deepest line first so overlaps stack subtly)
  const areas = series.map((s) => `${s.d} V${AXIS} H${PL} Z`);

  // Inline tag chips: staggered along each line so they never pile up
  const chips = series.map((s, i) => {
    const m = Math.round(total * (0.16 + (i * 0.16) % 0.6));
    return { tag: s.tag, cx: x(m), cy: y(valueAt(i, m)), i };
  });

  // End labels, nudged apart when lines converge
  const endLabels = series
    .map((s, i) => ({ ...s, i, ly: y(s.finalBase) + 4 }))
    .sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].ly - endLabels[i - 1].ly < 12) endLabels[i].ly = endLabels[i - 1].ly + 12;
  }

  // Quiet 10-point y-grid
  const gridVals: number[] = [];
  for (let v = Math.ceil(yMin / 10) * 10; v <= Math.floor(yMax / 10) * 10; v += 10) gridVals.push(v);

  const years: string[] = [];
  for (let yr = Number(today.slice(0, 4)) + 1; yr <= Number(horizonEnd.slice(0, 4)); yr++) years.push(String(yr));

  const endsAt = new Set(events.filter((e) => e.causes.some((c) => c.kind === 'eligibilityEnd')).map((e) => e.date));

  // Hover → month + tooltip rows
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = rectRef.current ?? (rectRef.current = e.currentTarget.getBoundingClientRect());
    const px = ((e.clientX - rect.left) / rect.width) * W;
    if (px < PL || px > endX) { setHoverM(null); return; }
    setHoverM(Math.max(0, Math.min(total, Math.round(((px - PL) / (endX - PL)) * total))));
  };
  const hover = hoverM !== null
    ? {
        m: hoverM,
        hx: x(hoverM),
        month: addMonths(today, hoverM),
        rows: startBases
          .map((_, i) => ({ tag: String.fromCharCode(65 + i), v: valueAt(i, hoverM), i }))
          .sort((a, b) => b.v - a.v),
      }
    : null;
  const tipW = 96, tipH = 20 + (hover?.rows.length ?? 0) * 15;
  const tipX = hover ? (hover.hx + tipW + 18 > endX ? hover.hx - tipW - 10 : hover.hx + 10) : 0;
  const focusX = focusEventIndex !== null && events[focusEventIndex] ? xDate(events[focusEventIndex].date) : null;

  const lineOpacity = (i: number) => (focusLine === null || focusLine === i ? 1 : DIM);

  return (
    <div className="mt-[26px]">
      {/* Series key: which occupation each line style belongs to */}
      <div className="flex flex-wrap gap-x-6 gap-y-1.5 mb-3" onMouseLeave={() => setFocusLine(null)}>
        {series.map((s, i) => (
          <button
            key={s.tag}
            type="button"
            onMouseEnter={() => setFocusLine(i)}
            onFocus={() => setFocusLine(i)}
            className="flex items-center gap-2 p-0 cursor-default text-left"
            style={{ background: 'none', border: 'none', opacity: lineOpacity(i), transition: 'opacity 0.2s ease' }}
          >
            <svg width="24" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="24" y2="3" stroke="var(--ink)" strokeWidth="1.6" strokeDasharray={DASHES[i % DASHES.length]} />
            </svg>
            <span className="text-[0.8125rem] leading-none" style={{ fontFamily: 'var(--font-serif)' }}>{s.tag}</span>
            <span className="text-[0.75rem] leading-none" style={{ color: 'var(--ink-soft)' }}>
              {seriesLabels?.[i] ?? ''}
            </span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('tlChartSummary', { from: today, to: horizonEnd, score: startScore, n: events.length })}
        style={{ minWidth: 560, width: '100%', display: 'block', touchAction: 'pan-y' }}
        onPointerEnter={(e) => { rectRef.current = e.currentTarget.getBoundingClientRect(); }}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => { rectRef.current = null; setHoverM(null); setFocusLine(null); }}
      >
        {/* y-grid + goal band + threshold lines */}
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={PL} y1={y(v)} x2={W - PR} y2={y(v)} stroke="var(--hair-soft)" strokeWidth="0.6" strokeDasharray="1 4" />
            <text x={PL - 7} y={y(v) + 3} fontSize="8.5" fill="var(--muted)" textAnchor="end" className="tabular-nums">{v}</text>
          </g>
        ))}
        <rect x={PL} y={TOP} width={W - PL - PR} height={Math.max(0, y(goal) - TOP)} fill="var(--ink)" opacity="0.045" />
        <line x1={PL} y1={y(goal)} x2={W - PR} y2={y(goal)} stroke="var(--muted)" strokeWidth="0.75" strokeDasharray="1 5" />
        <text x={W - PR} y={y(goal) - 6} fontSize="10" fill="var(--muted)" textAnchor="end" letterSpacing="1">{t('tlGoalLine', { n: goal })}</text>
        <line x1={PL} y1={y(MIN_POINTS)} x2={W - PR} y2={y(MIN_POINTS)} stroke="var(--hair)" strokeWidth="0.75" strokeDasharray="1 5" />
        <text x={W - PR} y={y(MIN_POINTS) + 14} fontSize="10" fill="var(--muted)" textAnchor="end" letterSpacing="1">{t('tlMinLine', { n: MIN_POINTS })}</text>

        {/* today hairline */}
        <line x1={PL} y1={TOP} x2={PL} y2={AXIS} stroke="var(--hair)" strokeWidth="1" />
        <text x={PL} y={TOP - 10} fontSize="10" fill="var(--muted)" letterSpacing="2">{t('tlToday')}</text>
        {single && (
          <text x={PL + 12} y={y(startBases[0]) - 8} fontSize="17" fontFamily="var(--font-serif)" fill="var(--ink)">{startBases[0]}</text>
        )}

        {/* layered soft areas + step lines + hit areas */}
        {areas.map((a, i) => (
          <path key={i} d={a} fill="var(--ink)" opacity={0.038 * lineOpacity(i)} />
        ))}
        {series.map((s, i) => (
          <g key={s.tag} style={{ transition: 'opacity 0.2s ease' }} opacity={lineOpacity(i)}>
            <path d={s.d} fill="none" stroke="var(--ink)" strokeWidth={focusLine === i ? 2 : 1.6} strokeLinejoin="round" strokeDasharray={DASHES[i % DASHES.length]} />
            {s.dots.map((dot, k) => (
              <g key={k}>
                <circle cx={dot.ex} cy={dot.ey} r="3.5" fill={dot.up ? 'var(--ink)' : 'none'} stroke={dot.up ? 'var(--ink)' : 'var(--danger)'} strokeWidth="1.5" />
                <line x1={dot.ex} y1={dot.ey + 5} x2={dot.ex} y2={AXIS} stroke="var(--hair)" strokeWidth="0.55" />
              </g>
            ))}
            {/* invisible fat stroke = generous hover target */}
            <path d={s.d} fill="none" stroke="transparent" strokeWidth="14" style={{ cursor: 'pointer' }} onPointerEnter={() => setFocusLine(i)} />
          </g>
        ))}

        {/* inline tag chips punched out of the lines */}
        {!single && chips.map((c) => (
          <g key={c.tag} opacity={lineOpacity(c.i)} style={{ transition: 'opacity 0.2s ease' }}>
            <rect x={c.cx - 8} y={c.cy - 8} width="16" height="15" fill="var(--bg)" />
            <text x={c.cx} y={c.cy + 3.5} fontSize="10.5" fontFamily="var(--font-serif)" textAnchor="middle" fill="var(--ink)">{c.tag}</text>
          </g>
        ))}

        {/* line-end tags + final values (hoverable) */}
        {endLabels.map((s) => (
          <text
            key={s.tag}
            x={endX + 7}
            y={s.ly}
            fontSize="12"
            fontFamily="var(--font-serif)"
            fill="var(--ink)"
            opacity={lineOpacity(s.i)}
            style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
            onPointerEnter={() => setFocusLine(s.i)}
          >
            {s.tag}&nbsp;{s.finalBase}
          </text>
        ))}

        {/* event markers: low-hung warning flags + numbered lane under the axis */}
        {events.map((e, i) => {
          const ex = xDate(e.date);
          const isEnd = endsAt.has(e.date);
          const danger = e.warning || e.delta < 0 || isEnd;
          const focused = focusEventIndex === i;
          return (
            <g key={e.date}>
              {e.warning && (
                <>
                  <line x1={ex} y1={AXIS - 34} x2={ex} y2={AXIS} stroke="var(--danger)" strokeWidth="0.75" strokeDasharray="3 3" />
                  <rect x={ex - 3.75} y={AXIS - 40} width="7.5" height="7.5" transform={`rotate(45 ${ex} ${AXIS - 36})`} fill="none" stroke="var(--danger)" strokeWidth="1.2" />
                </>
              )}
              {isEnd && series.map((s, si) => (
                <g key={s.tag}>
                  <line x1={ex - 5} y1={y(e.basesAfter[si]) - 5} x2={ex + 5} y2={y(e.basesAfter[si]) + 5} stroke="var(--danger)" strokeWidth="1.5" />
                  <line x1={ex - 5} y1={y(e.basesAfter[si]) + 5} x2={ex + 5} y2={y(e.basesAfter[si]) - 5} stroke="var(--danger)" strokeWidth="1.5" />
                </g>
              ))}
              <text
                x={ex}
                y={AXIS + 15}
                fontSize={focused ? 12 : 10.5}
                fontWeight={focused ? 600 : 400}
                fontFamily="var(--font-serif)"
                textAnchor="middle"
                fill={danger ? 'var(--danger)' : focused ? 'var(--ink)' : 'var(--muted)'}
              >
                {i + 1}
              </text>
              {focused && (
                <line x1={ex} y1={TOP} x2={ex} y2={AXIS} stroke="var(--muted)" strokeWidth="0.75" strokeDasharray="2 3" />
              )}
            </g>
          );
        })}

        {/* axis + year ticks */}
        <line x1={PL} y1={AXIS} x2={W - PR} y2={AXIS} stroke="var(--ink)" strokeWidth="1" />
        {years.map((yr) => (
          <text key={yr} x={xDate(`${yr}-01`)} y={H - 4} fontSize="9.5" fill="var(--muted)" textAnchor="middle">{yr}</text>
        ))}

        {/* hover crosshair + tooltip (pointer-only enhancement) */}
        {hover && (
          <g aria-hidden="true" style={{ pointerEvents: 'none' }}>
            <line x1={hover.hx} y1={TOP} x2={hover.hx} y2={AXIS} stroke="var(--muted)" strokeWidth="0.75" strokeDasharray="2 3" />
            {hover.rows.map((r) => (
              <circle key={r.tag} cx={hover.hx} cy={y(r.v)} r="2.6" fill="var(--ink)" opacity={lineOpacity(r.i)} />
            ))}
            <rect x={tipX} y={TOP + 6} width={tipW} height={tipH} fill="var(--surface)" stroke="var(--hair)" strokeWidth="1" />
            <text x={tipX + 10} y={TOP + 22} fontSize="9.5" fill="var(--muted)" letterSpacing="1" className="tabular-nums">{hover.month}</text>
            {hover.rows.map((r, k) => (
              <text
                key={r.tag}
                x={tipX + 10}
                y={TOP + 37 + k * 15}
                fontSize="11"
                fontFamily="var(--font-serif)"
                fill="var(--ink)"
                opacity={k === 0 ? 1 : 0.75}
                className="tabular-nums"
              >
                {r.tag}&nbsp;&nbsp;{r.v}
              </text>
            ))}
          </g>
        )}
      </svg>
      </div>
    </div>
  );
}

export default memo(TimelineChart);
