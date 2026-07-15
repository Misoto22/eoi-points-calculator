import type { Evaluation } from './points';
import { hasOccupation, pathwayStatus } from './points';
import { MIN_POINTS } from '@/data/pointsCriteria';
import type { CardTheme } from '@/data/cardThemes';
import { cardPalettes } from '@/data/cardThemes';

export interface CardLabels {
  title: string;
  totalCaps: string;
  points: string;
  cardGoal: string;
  cardMin: string;
  noBestPath: string;
  noPathEligible: string;
  bestPathPrefix: string;
  cardEmpty: string;
  cardShared: string;
  sharedSubtotal: string;
  /** Short labels for breakdown rows, keyed like `bd.*` */
  breakdown: Record<string, string>;
  cardPathways: string;
  jobBase: string;
  noOccName: string;
  cardFoot: string;
}

export interface CardOptions {
  evaluation: Evaluation;
  goal: number;
  lang: string;
  theme: CardTheme;
  labels: CardLabels;
  dateLabel: string;
  /** Device-pixel multiplier for the canvas backing store (default 2 = 2160×2880 export) */
  scale?: number;
}

const SHARED_ROW_ORDER = [
  'age', 'english', 'education', 'stem', 'ausStudy', 'regionalStudy', 'communityLanguage', 'partnerStatus',
] as const;

const SERIF = '"Noto Serif SC", "Songti SC", serif';
const SANS = '"Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

/** Wait for the serif weights the card uses; resolves quickly if already loaded */
export async function ensureCardFonts(): Promise<void> {
  await Promise.race([
    Promise.all([
      document.fonts.load(`300 240px ${SERIF}`, '85分'),
      document.fonts.load(`400 30px ${SERIF}`, '总分明细'),
      document.fonts.load(`500 32px ${SERIF}`, '30总'),
    ]),
    new Promise((res) => setTimeout(res, 1800)),
  ]).catch(() => { /* fall back to system serif */ });
}

/**
 * Draw the share card. Layout runs in 1080×1440 logical pixels; the canvas
 * backing store is `scale`× larger so the exported PNG stays crisp on
 * high-DPI screens. Colors come from cardThemes, values from the evaluation.
 */
export function drawCard({ evaluation, goal, lang, theme, labels, dateLabel, scale = 2 }: CardOptions): HTMLCanvasElement {
  const ev = evaluation;
  // Headline number is the bare score (裸分); pathway rows below carry the +5/+15 route totals.
  const total = ev.bareScore;
  const C = cardPalettes[theme];
  const W = 1080, H = 1440, P = 96, IW = W - P * 2;

  const cv = document.createElement('canvas');
  cv.width = W * scale;
  cv.height = H * scale;
  const ctx = cv.getContext('2d')!;
  ctx.scale(scale, scale);

  const setLS = (v: string) => {
    try {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v;
    } catch { /* not supported everywhere */ }
  };
  const line = (y: number, col: string, h = 1) => {
    ctx.fillStyle = col;
    ctx.fillRect(P, y, IW, h);
  };
  const fit = (text: string, maxW: number): string => {
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
    return `${s}…`;
  };

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // Masthead
  setLS('7px');
  ctx.font = `500 25px ${SANS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText('EOI POINTS', P, 128);
  setLS('2px');
  ctx.font = `400 24px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText(dateLabel, W - P, 128);
  ctx.textAlign = 'left';
  setLS('0px');
  line(160, C.ink, 2);

  ctx.font = `400 32px ${SERIF}`;
  ctx.fillStyle = C.soft;
  ctx.fillText(fit(labels.title, IW), P, 232);

  // Total
  setLS('5px');
  ctx.font = `500 22px ${SANS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(labels.totalCaps, P, 312);
  setLS('0px');
  ctx.font = `300 224px ${SERIF}`;
  ctx.fillStyle = C.ink;
  const numStr = String(total);
  ctx.fillText(numStr, P - 8, 528);
  const numW = ctx.measureText(numStr).width;
  ctx.font = `400 34px ${SANS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(labels.points, P + numW + 14, 524);
  ctx.textAlign = 'right';
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText(`${labels.cardGoal}  ${goal}`, W - P, 484);
  ctx.fillText(`${labels.cardMin}  ${MIN_POINTS}`, W - P, 526);
  ctx.textAlign = 'left';

  // Best pathway line
  ctx.font = `400 28px ${SERIF}`;
  ctx.fillStyle = C.soft;
  let bestLine = ev.jobs.some(hasOccupation) ? labels.noPathEligible : labels.noBestPath;
  if (ev.best) {
    const occ = ev.best.job.occupation;
    const occName = occ ? (lang === 'zh' ? occ.zh : occ.en) : '';
    bestLine = `${labels.bestPathPrefix} — ${occName} · ${ev.best.code}`;
  } else if (total === 0) {
    bestLine = labels.cardEmpty;
  }
  ctx.fillText(fit(bestLine, IW), P, 586);

  // Progress bar
  const ratio = Math.max(0, Math.min(total / goal, 1));
  ctx.fillStyle = C.hair;
  ctx.fillRect(P, 628, IW, 4);
  ctx.fillStyle = C.ink;
  ctx.fillRect(P, 628, Math.round(IW * ratio), 4);

  line(688, C.hair, 1);

  // Shared breakdown
  setLS('5px');
  ctx.font = `500 22px ${SANS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(labels.cardShared, P, 742);
  setLS('0px');

  const shRows = SHARED_ROW_ORDER
    .filter((k) => ev.shared[k] > 0)
    .map((k) => ({ label: labels.breakdown[k], value: ev.shared[k] }));
  const rowsTop = 764;
  let y = rowsTop;
  if (shRows.length === 0) {
    ctx.font = `400 26px ${SANS}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(labels.cardEmpty, P, y + 40);
    y += 64;
  } else {
    // Two columns to save vertical space
    const colGap = 56;
    const colW = (IW - colGap) / 2;
    const perCol = Math.ceil(shRows.length / 2);
    const rowH = Math.min(44, 188 / perCol);
    shRows.forEach((r, i) => {
      const col = i < perCol ? 0 : 1;
      const idx = col === 0 ? i : i - perCol;
      const colX = P + col * (colW + colGap);
      const yb = rowsTop + rowH * (idx + 1) - Math.round(rowH * 0.3);
      ctx.font = `400 24px ${SANS}`;
      ctx.fillStyle = C.soft;
      ctx.fillText(fit(r.label, colW - 70), colX, yb);
      ctx.font = `500 27px ${SERIF}`;
      ctx.fillStyle = C.ink;
      ctx.textAlign = 'right';
      ctx.fillText(String(r.value), colX + colW, yb);
      ctx.textAlign = 'left';
      if (idx < perCol - 1) {
        ctx.fillStyle = C.hairSoft;
        ctx.fillRect(colX, rowsTop + rowH * (idx + 1), colW, 1);
      }
    });
    y = rowsTop + rowH * perCol;
    line(y + 6, C.hair, 1);
    ctx.font = `400 24px ${SANS}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(labels.sharedSubtotal, P, y + 44);
    ctx.font = `500 30px ${SERIF}`;
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'right';
    ctx.fillText(String(ev.sharedTotal), W - P, y + 44);
    ctx.textAlign = 'left';
    y += 64;
  }

  // Pathways — fixed slots per visa so rows never overlap
  const jobsWithData = ev.jobs.filter((je) => je.occupation || je.base > ev.sharedTotal);
  if (jobsWithData.length) {
    setLS('5px');
    ctx.font = `500 22px ${SANS}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(labels.cardPathways, P, y + 46);
    setLS('0px');
    let jy = y + 64;
    const avail = 1300 - jy;
    const jh = Math.min(82, Math.max(56, avail / jobsWithData.length));
    const slotW = 126;
    const pathCount = jobsWithData[0].pathways.length;
    const nameMax = (W - P - slotW * (pathCount - 1)) - 96 - P - 26;
    jobsWithData.forEach((je, idx) => {
      const name = je.occupation
        ? (lang === 'zh' ? je.occupation.zh : je.occupation.en)
        : labels.noOccName;
      const subStr = `${je.occupation ? `${je.occupation.list} · ` : ''}${labels.jobBase} ${je.base}`;
      ctx.font = `400 25px ${SANS}`;
      ctx.fillStyle = C.ink;
      ctx.fillText(`${String.fromCharCode(65 + je.index)}   ${fit(name, nameMax)}`, P, jy + 25);
      ctx.font = `400 18px ${SANS}`;
      ctx.fillStyle = C.muted;
      ctx.fillText(subStr, P + 40, jy + 51);
      je.pathways.forEach((p, k) => {
        const x = W - P - slotW * (pathCount - 1 - k);
        // Dash only for the federal-list gate (not on MLTSSL/STSOL/ROL for this pathway) — the
        // same precedence ResultsBand and ReportView use, so the card never shows a different
        // reason than the live UI does for the same pathway.
        const totStr = pathwayStatus(p) === 'listNo' ? '—' : String(p.total);
        ctx.textAlign = 'right';
        ctx.font = `500 28px ${SERIF}`;
        ctx.fillStyle = p.eligible ? C.ink : C.muted;
        ctx.fillText(totStr, x, jy + 25);
        const tw = ctx.measureText(totStr).width;
        ctx.font = `400 17px ${SANS}`;
        ctx.fillStyle = C.muted;
        ctx.fillText(p.code, x, jy + 51);
        ctx.textAlign = 'left';
        if (p.eligible) {
          ctx.beginPath();
          ctx.arc(x - tw - 13, jy + 17, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = C.ink;
          ctx.fill();
        }
      });
      if (idx < jobsWithData.length - 1 && jh >= 64) line(jy + jh - 10, C.hairSoft, 1);
      jy += jh;
    });
  }

  // Footer
  line(1318, C.hair, 1);
  ctx.font = `400 20px ${SANS}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(labels.cardFoot, P, 1362);
  setLS('3px');
  ctx.font = `400 18px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText('EOI POINTS CALCULATOR', W - P, 1362);
  ctx.textAlign = 'left';
  setLS('0px');
  return cv;
}
