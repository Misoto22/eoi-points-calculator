'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { languages } from '@/app/i18n/settings';
import { motion } from 'framer-motion';
import { FaGlobe } from 'react-icons/fa';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2">
      <FaGlobe className="text-primary-600 dark:text-primary-400 text-lg" />
      <div className="flex space-x-2">
        {languages.map((lng) => (
          <motion.button
            key={lng}
            onClick={() => changeLanguage(lng)}
            className={`px-3 py-1 rounded-md transition-colors duration-200 ${
              i18n.language === lng
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t(`language.${lng}`)}
          </motion.button>
        ))}
      </div>
    </div>
  );
} 