'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string, namespace: string) => {
    return import(`../../../public/locales/${language}/${namespace}.json`);
  }))
  .init({
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    supportedLngs: ['en', 'zh'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['cookie', 'localStorage'],
    },
  });

// Keep <html lang> in sync so screen readers pick the right voice
i18next.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.startsWith('zh') ? 'zh-Hans' : 'en';
  }
});

export default i18next;
