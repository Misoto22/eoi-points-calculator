'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Evaluation } from '@/lib/points';
import { drawCard, ensureCardFonts } from '@/lib/exportCard';
import type { CardLabels } from '@/lib/exportCard';
import type { CardTheme } from '@/data/cardThemes';
import { todayLabel } from './Header';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  evaluation: Evaluation;
  goal: number;
}

const BD_KEYS = [
  'age', 'english', 'education', 'partnerStatus',
  'stem', 'ausStudy', 'regionalStudy', 'communityLanguage',
  'ausWork', 'overseasWork', 'professionalYear',
];

export default function ExportModal({ open, onClose, evaluation, goal }: ExportModalProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';

  const [cardTheme, setCardTheme] = useState<CardTheme>('cream');
  const [img, setImg] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const genSeqRef = useRef(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Move focus into the dialog on open, give it back on close
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => restoreFocusRef.current?.focus();
  }, [open]);

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const seq = (genSeqRef.current += 1);
    setLoading(true);
    setImg('');
    (async () => {
      await ensureCardFonts();
      if (cancelled || seq !== genSeqRef.current) return;
      const labels: CardLabels = {
        title: t('title'),
        totalCaps: t('totalCaps'),
        points: t('points'),
        cardGoal: t('cardGoal'),
        cardMin: t('cardMin'),
        noBestPath: t('noBestPath'),
        bestPathPrefix: t('bestPathPrefix'),
        cardEmpty: t('cardEmpty'),
        cardShared: t('cardShared'),
        sharedSubtotal: t('sharedSubtotal'),
        breakdown: Object.fromEntries(BD_KEYS.map((k) => [k, t(`bd.${k}`)])),
        cardPathways: t('cardPathways'),
        jobBase: t('jobBase'),
        noOccName: t('noOccName'),
        cardFoot: t('cardFoot'),
      };
      try {
        const canvas = drawCard({ evaluation, goal, lang, theme: cardTheme, labels, dateLabel: todayLabel() });
        if (cancelled || seq !== genSeqRef.current) return;
        canvasRef.current = canvas;
        setImg(canvas.toDataURL('image/png'));
      } finally {
        if (!cancelled && seq === genSeqRef.current) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, cardTheme, lang, evaluation, goal, t]);

  if (!open) return null;

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    const unit = lang === 'zh' ? '分' : 'pts';
    // Filename carries the bare score — same figure every other surface shows
    a.download = `EOI-${evaluation.bareScore}${unit}-${todayLabel().replace(/\./g, '-')}.png`;
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  };

  const themeTab = (value: CardTheme, label: string) => (
    <button
      type="button"
      onClick={() => setCardTheme(value)}
      aria-pressed={cardTheme === value}
      className="cursor-pointer text-xs tracking-[0.1em] py-3 -my-2"
      style={{
        background: 'none',
        border: 'none',
        color: cardTheme === value ? 'var(--overlay-ink)' : 'var(--overlay-dim)',
        borderBottom: cardTheme === value ? '1px solid var(--overlay-ink)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ padding: '22px', paddingBottom: 'max(22px, env(safe-area-inset-bottom))' }}
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(7px)', animation: 'eoiFadeIn 0.25s ease backwards' }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('exportBtn')}
        tabIndex={-1}
        onKeyDown={trapTab}
        className="relative flex flex-col gap-3.5 outline-none"
        style={{ width: 'min(86vw, 380px)', animation: 'eoiModalIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards' }}
      >
        <div className="flex justify-between items-center">
          <div className="flex gap-3.5 text-xs">
            {themeTab('cream', t('cardCream'))}
            {themeTab('charcoal', t('cardCharcoal'))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-xl leading-none p-3 -m-2 hover:text-[var(--overlay-ink)]"
            style={{ background: 'none', border: 'none', color: 'var(--overlay-muted)' }}
          >
            ×
          </button>
        </div>
        <div className="flex justify-center" style={{ maxHeight: '64vh' }}>
          {img && !loading && (
            /* Canvas-generated preview, not a static asset */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={img}
              alt="EOI share card preview"
              className="block"
              style={{ maxWidth: '100%', maxHeight: '64vh', boxShadow: 'var(--overlay-shadow)' }}
            />
          )}
          {loading && (
            <div
              className="w-full flex items-center justify-center text-[0.78125rem] tracking-[0.12em]"
              style={{
                aspectRatio: '3 / 4',
                background: 'var(--overlay-surface)',
                border: '1px solid var(--overlay-hair-soft)',
                color: 'var(--overlay-muted)',
              }}
            >
              {t('generating')}
            </div>
          )}
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={download}
            className="flex-1 cursor-pointer text-[0.78125rem] tracking-[0.18em] font-medium px-5 py-3.5 hover:opacity-88"
            style={{ background: 'var(--overlay-ink)', color: 'var(--overlay-contrast)', border: 'none' }}
          >
            {t('download')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[0.78125rem] tracking-[0.14em] px-5 py-3.5 hover:border-[var(--overlay-ink)] hover:text-[var(--overlay-ink)]"
            style={{ background: 'none', color: 'var(--overlay-soft)', border: '1px solid var(--overlay-hair)' }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
