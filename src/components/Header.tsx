'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import { useMounted } from '@/hooks/useMounted';

export function todayLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

interface HeaderProps {
  /** Defaults to the points-tested calculator's own title/subtitle (t('title')/t('subtitle')) */
  titleKey?: string;
  subtitleKey?: string;
}

export default function Header({ titleKey = 'title', subtitleKey = 'subtitle' }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Theme is only known on the client; render the pre-mount state identically
  // to the server markup to avoid hydration mismatches.
  const mounted = useMounted();

  // Hairline under the sticky bar only once the page has scrolled.
  // In standalone mode the body is the scroller (see globals.css), so
  // listen on both — scroll events don't bubble from body to window.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || document.body.scrollTop) > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.body.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.removeEventListener('scroll', onScroll);
    };
  }, []);

  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const resolvedTheme = mounted
    ? (theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme)
    : 'light';

  const langButton = (code: 'zh' | 'en', label: string) => (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(code)}
      aria-pressed={lang === code}
      className="cursor-pointer text-xs px-2.5 -mx-1 py-[14px] -my-[11px]"
      style={{
        background: 'none',
        border: 'none',
        color: lang === code ? 'var(--ink)' : 'var(--muted)',
        letterSpacing: code === 'zh' ? '0.06em' : '0.08em',
      }}
    >
      <span style={{ borderBottom: lang === code ? '1px solid var(--ink)' : '1px solid transparent', paddingBottom: 2 }}>
        {label}
      </span>
    </button>
  );

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className="text-xs tracking-[0.1em] px-1 -mx-1 py-[14px] -my-[11px] hover:text-[var(--ink)]"
        style={{ color: active ? 'var(--ink)' : 'var(--muted)' }}
      >
        <span style={{ borderBottom: active ? '1px solid var(--ink)' : '1px solid transparent', paddingBottom: 2 }}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    // Fragment: the nav bar must be a direct child of the page container so
    // position:sticky can pin it for the whole page, not just the header.
    <>
      <div
        className="sticky top-0 z-40 pb-3.5"
        style={{
          // 22px of our own air + the iOS standalone status-bar inset
          paddingTop: 'calc(22px + env(safe-area-inset-top, 0px))',
          background: 'color-mix(in srgb, var(--bg) 86%, transparent)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: scrolled ? '1px solid var(--hair)' : '1px solid transparent',
          transition: 'border-color 0.25s ease, background 0.4s ease',
          animation: 'eoiFadeUp 0.7s ease backwards',
        }}
      >
        <div className="flex justify-between items-center gap-4">
          <Link href="/" className="text-[0.71875rem] tracking-[0.24em] font-medium" style={{ color: 'var(--ink)' }}>
            EOI&nbsp;POINTS
          </Link>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5 text-xs">
              {langButton('zh', '中文')}
              <span className="w-px h-3" style={{ background: 'var(--hair)' }} />
              {langButton('en', 'EN')}
            </div>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label={t('themeHint')}
              aria-pressed={resolvedTheme === 'dark'}
              title={t('themeHint')}
              className="theme-toggle w-11 h-11 -m-[9px] rounded-full cursor-pointer p-0 flex items-center justify-center"
              style={{ background: 'none', border: 'none' }}
            >
              <span
                aria-hidden="true"
                className="block w-[26px] h-[26px] rounded-full"
                style={{
                  border: '1px solid var(--muted)',
                  background: 'linear-gradient(90deg, var(--ink) 50%, transparent 50%)',
                  transform: resolvedTheme === 'dark' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.35s ease',
                }}
              />
            </button>
          </div>
        </div>

        {/* Own row on every viewport — inline with the logo it either wraps
            labels mid-word on narrow screens or forces a two-line jump when
            the lang/theme cluster overflows. A dedicated row scales cleanly
            down to mobile without either problem. */}
        <nav className="flex items-center gap-4 mt-3" aria-label={t('navLabel')}>
          {navLink('/profile', t('navProfile'))}
          {navLink('/', t('navIndependent'))}
          {navLink('/sponsorship', t('navSponsorship'))}
        </nav>
      </div>

      <header style={{ animation: 'eoiFadeUp 0.7s ease backwards' }}>
      <h1
        className="font-normal mt-[58px] mb-0 max-w-[16em]"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.875rem, 5.2vw, 2.75rem)',
          lineHeight: 1.32,
          letterSpacing: '0.01em',
        }}
      >
        {t(titleKey)}
      </h1>
      <div
        className="flex justify-between items-baseline gap-4 flex-wrap mt-[26px] pt-3.5"
        style={{ borderTop: '1px solid var(--hair)' }}
      >
        <p className="m-0 text-[0.8125rem] tracking-[0.02em]" style={{ color: 'var(--muted)' }}>
          {t(subtitleKey)}
        </p>
        <span className="text-xs tabular-nums tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
          {todayLabel()}
        </span>
      </div>
      </header>
    </>
  );
}
