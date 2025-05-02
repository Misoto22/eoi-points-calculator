'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import CalculatorForm from '@/components/CalculatorForm';
import '@/app/i18n/client';

export default function Home() {
  const { t } = useTranslation();
  const [totalPoints, setTotalPoints] = useState(0);
  const [goalPoints, setGoalPoints] = useState(65);
  const MIN_POINTS = 65;

  const progress = Math.min((totalPoints / goalPoints) * 100, 100);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-center md:text-left">{t('title')}</h1>
          <div className="flex items-center justify-center md:justify-end space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <CalculatorForm onPointsChange={setTotalPoints} />
          
          <motion.div 
            className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold mb-2">{t('total')}: {totalPoints}</h2>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                <span>{t('minimum')}: {MIN_POINTS} {t('points')}</span>
                <div className="flex items-center space-x-2">
                  <span>{t('goal')}:</span>
                  <input
                    type="number"
                    min={MIN_POINTS}
                    max={100}
                    step={5}
                    value={goalPoints}
                    onChange={(e) => setGoalPoints(Math.max(MIN_POINTS, Math.min(100, parseInt(e.target.value) || MIN_POINTS)))}
                    className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                  <span>{t('points')}</span>
                </div>
              </div>

              <AnimatePresence>
                {totalPoints < goalPoints && (
                  <motion.div 
                    className={`mt-4 p-3 rounded-md text-sm ${
                      totalPoints < MIN_POINTS 
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {t('pointsWarning', { points: goalPoints - totalPoints })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 