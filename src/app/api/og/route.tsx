import { ImageResponse } from 'next/og';
import { cardPalettes } from '@/data/cardThemes';

export const runtime = 'edge';

const C = cardPalettes.cream;
const fontData = fetch(new URL('./NotoSerifSC-sub.otf', import.meta.url))
  .then((r) => r.arrayBuffer())
  .catch(() => null);   // null = render without custom font

function card(score: number, lang: 'zh' | 'en', occ: string[], eligible: string[]) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.ink, padding: '56px 72px', fontFamily: 'Serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${C.ink}`, paddingBottom: 18 }}>
        <span style={{ fontSize: 26, letterSpacing: 8, color: C.muted }}>EOI POINTS</span>
        <span style={{ fontSize: 24, color: C.muted }}>189 · 190 · 491</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, marginTop: 30 }}>
        <span style={{ fontSize: 240, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 40, color: C.muted, paddingBottom: 30 }}>{lang === 'zh' ? '分' : 'pts'}</span>
        <span style={{ fontSize: 26, color: C.soft, paddingBottom: 36, marginLeft: 'auto' }}>
          {eligible.length ? eligible.join(' · ') : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 10 }}>
        {occ.map((name) => (
          <span key={name} style={{ fontSize: 30, color: C.soft, borderTop: `1px solid ${C.hair}`, paddingTop: 10 }}>{name}</span>
        ))}
        <span style={{ fontSize: 20, color: C.muted, marginTop: 12 }}>eoi-points-calculator.vercel.app</span>
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  // With fonts: [] satori falls back to its default font — acceptable degraded mode.
  const fontBuffer = await fontData;
  const opts = {
    width: 1200, height: 630,
    fonts: fontBuffer ? [{ name: 'Serif', data: fontBuffer, weight: 500 as const }] : [],
    headers: { 'cache-control': 'public, immutable, no-transform, max-age=31536000' },
  };
  try {
    const p = new URL(req.url).searchParams;
    const score = Math.max(0, Math.min(200, Number(p.get('s')) || 0));
    const lang = p.get('l') === 'zh' ? 'zh' as const : 'en' as const;
    // Cap segment length too, not just count — a direct (non-browser) request
    // with an oversized occ=/e= value shouldn't be able to inflate satori's
    // render cost via a handful of very long strings.
    const occ = (p.get('occ') || '').split('|').filter(Boolean).slice(0, 3).map((s) => s.slice(0, 80));
    const eligible = (p.get('e') || '').split('|').filter(Boolean).slice(0, 3).map((s) => s.slice(0, 80));
    return new ImageResponse(card(score, lang, occ, eligible), opts);
  } catch {
    // Malformed input must never 500 — serve a generic card
    return new ImageResponse(card(0, 'en', [], []), opts);
  }
}
