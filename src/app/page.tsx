'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CalculatorForm from '@/components/CalculatorForm';
import '@/app/i18n/client';

export default function Home() {
  const { t } = useTranslation();
  const [totalPoints, setTotalPoints] = useState(0);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <LanguageSwitcher />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <CalculatorForm onPointsChange={setTotalPoints} />
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{t('total')}:</span>
              <span className={`text-2xl font-bold ${totalPoints >= 65 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPoints} {t('points')}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {t('minimum')}: 65 {t('points')}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 