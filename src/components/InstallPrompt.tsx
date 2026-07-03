'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DISMISS_KEY = 'eoi-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** iOS share glyph — the hint references the button this draws */
function ShareGlyph() {
  return (
    <svg width="12" height="15" viewBox="0 0 12 15" fill="none" aria-hidden="true" className="inline -mt-0.5">
      <path d="M6 1v9M3 3.5L6 1l3 2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M2 6H1v8h10V6h-1" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/**
 * Install guidance: iOS Safari has no install banner, so browsing (non-
 * standalone) visitors get a one-time "share → add to Home Screen" hint;
 * Chromium browsers get a custom install button via beforeinstallprompt.
 */
export default function InstallPrompt() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'ios' | 'chromium' | null>(null);
  const bipRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch { /* private mode */ }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = navigator.userAgent;
    // iPadOS ≥13 reports a Mac UA; the touch check catches it
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
    if (isIos && isSafari) {
      setMode('ios');
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      bipRef.current = e as BeforeInstallPromptEvent;
      setMode('chromium');
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
    setMode(null);
  };

  const install = async () => {
    const bip = bipRef.current;
    if (!bip) return;
    await bip.prompt();
    await bip.userChoice;
    setMode(null);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[18px] left-[18px] right-[18px] sm:left-auto sm:w-[340px] z-50 px-[18px] py-4"
      style={{
        background: 'var(--band-bg)',
        color: 'var(--band-ink)',
        boxShadow: 'var(--shadow)',
        animation: 'eoiFadeUp 0.4s ease backwards',
      }}
    >
      <div className="text-[11px] tracking-[0.18em] font-medium" style={{ color: 'var(--band-muted)' }}>
        {t('pwaTitle')}
      </div>
      <p className="m-0 mt-2 text-[12.5px] leading-[1.65]" style={{ color: 'var(--band-soft)' }}>
        {mode === 'ios' ? (
          <>
            {t('pwaIosHintPre')} <ShareGlyph /> {t('pwaIosHintPost')}
          </>
        ) : (
          t('pwaChromiumHint')
        )}
      </p>
      <div className="flex items-center gap-2.5 mt-3">
        {mode === 'chromium' && (
          <button
            type="button"
            onClick={install}
            className="cursor-pointer text-[11.5px] tracking-[0.14em] font-medium px-4 py-2 hover:opacity-85"
            style={{ background: 'var(--band-ink)', color: 'var(--band-bg)', border: 'none' }}
          >
            {t('pwaInstall')}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="cursor-pointer text-[11.5px] tracking-[0.14em] px-2.5 py-2 underline underline-offset-4"
          style={{ background: 'none', border: 'none', color: 'var(--band-muted)', textDecorationColor: 'var(--band-hair)' }}
        >
          {t('pwaLater')}
        </button>
      </div>
    </div>
  );
}
