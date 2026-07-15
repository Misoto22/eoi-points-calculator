'use client';

import { useTranslation } from 'react-i18next';

const LINKS = [
  { href: 'https://github.com/Misoto22/eoi-points-calculator', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/henry-misoto22/', label: 'LinkedIn' },
  { href: 'https://www.misoto22.com/', label: 'Website' },
];

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer
      className="mt-[84px] pt-[26px] pb-12 flex flex-col gap-5"
      style={{ borderTop: '1px solid var(--hair)' }}
    >
      <p className="m-0 text-xs leading-[1.8] max-w-[56em]" style={{ color: 'var(--muted)' }}>
        {t('disclaimer')}
      </p>
      <div className="flex justify-between items-baseline gap-3 flex-wrap text-xs" style={{ color: 'var(--muted)' }}>
        <span>© 2026 Henry Chen</span>
        <div className="flex gap-5">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[var(--ink)]"
              style={{ color: 'var(--muted)', textDecorationColor: 'var(--hair)' }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
