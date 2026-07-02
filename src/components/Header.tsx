'use client';

import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';

export function todayLabel(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const resolvedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  const langButton = (code: 'zh' | 'en', label: string) => (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(code)}
      className="cursor-pointer text-xs py-1"
      style={{
        background: 'none',
        border: 'none',
        color: lang === code ? 'var(--ink)' : 'var(--muted)',
        borderBottom: lang === code ? '1px solid var(--ink)' : '1px solid transparent',
        letterSpacing: code === 'zh' ? '0.06em' : '0.08em',
      }}
    >
      {label}
    </button>
  );

  return (
    <header className="pt-[34px]" style={{ animation: 'eoiFadeUp 0.7s ease both' }}>
      <div className="flex justify-between items-center gap-4">
        <div className="text-[11.5px] tracking-[0.24em] font-medium" style={{ color: 'var(--ink)' }}>
          EOI&nbsp;POINTS
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 text-xs">
            {langButton('zh', '中文')}
            <span className="w-px h-3" style={{ background: 'var(--hair)' }} />
            {langButton('en', 'EN')}
          </div>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            title={t('themeHint')}
            className="w-[26px] h-[26px] rounded-full cursor-pointer p-0"
            style={{
              border: '1px solid var(--muted)',
              background: resolvedTheme === 'dark' ? 'var(--ink)' : 'transparent',
              transition: 'background 0.3s ease',
            }}
          />
        </div>
      </div>
      <h1
        className="font-normal mt-[72px] mb-0 max-w-[16em]"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(30px, 5.2vw, 44px)',
          lineHeight: 1.32,
          letterSpacing: '0.01em',
        }}
      >
        {t('title')}
      </h1>
      <div
        className="flex justify-between items-baseline gap-4 flex-wrap mt-[26px] pt-3.5"
        style={{ borderTop: '1px solid var(--hair)' }}
      >
        <p className="m-0 text-[13px] tracking-[0.02em]" style={{ color: 'var(--muted)' }}>
          {t('subtitle')}
        </p>
        <span className="text-xs tabular-nums tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
          {todayLabel()}
        </span>
      </div>
    </header>
  );
}
