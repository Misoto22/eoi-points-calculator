'use client';

import { useTranslation } from 'react-i18next';
import { languages } from '@/app/i18n/settings';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-1">
      {languages.map((lng, index) => (
        <span key={lng} className="flex items-center gap-1">
          {index > 0 && (
            <span
              className="text-xs select-none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              /
            </span>
          )}
          <button
            onClick={() => changeLanguage(lng)}
            className="text-sm transition-colors duration-150"
            style={{
              color: i18n.language === lng ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: i18n.language === lng ? 500 : 400,
            }}
          >
            {t(`language.${lng}`)}
          </button>
        </span>
      ))}
    </div>
  );
}
