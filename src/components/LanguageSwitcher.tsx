'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { languages } from '@/app/i18n/settings';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex space-x-2">
      {languages.map((lng) => (
        <button
          key={lng}
          onClick={() => changeLanguage(lng)}
          className={`px-3 py-1 rounded-md ${
            i18n.language === lng
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t(`language.${lng}`)}
        </button>
      ))}
    </div>
  );
} 