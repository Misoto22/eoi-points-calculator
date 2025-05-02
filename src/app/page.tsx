'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import CalculatorForm from '@/components/CalculatorForm';
import '@/app/i18n/client';

// Create a client-only wrapper component
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
};

// Create a client-only page content component
const PageContent = () => {
  const { t } = useTranslation();
  const [totalPoints, setTotalPoints] = useState(0);
  const [goalPoints, setGoalPoints] = useState(65);
  const MIN_POINTS = 65;

  const handleGoalPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setGoalPoints(MIN_POINTS);
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setGoalPoints(Math.max(MIN_POINTS, Math.min(120, numValue)));
    }
  };

  const progress = Math.min((totalPoints / goalPoints) * 100, 100);

  return (
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
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-col space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>{t('minimum')}: {MIN_POINTS} {t('points')}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>{t('goal')}:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center h-8">
                    <button
                      onClick={() => setGoalPoints(prev => Math.max(MIN_POINTS, prev - 5))}
                      className="w-8 h-full flex items-center justify-center rounded-l border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                      aria-label="Decrease goal points"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={MIN_POINTS}
                      max={120}
                      step={5}
                      value={goalPoints}
                      onChange={handleGoalPointsChange}
                      className="w-14 h-full px-1 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      readOnly
                    />
                    <button
                      onClick={() => setGoalPoints(prev => Math.min(120, prev + 5))}
                      className="w-8 h-full flex items-center justify-center rounded-r border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                      aria-label="Increase goal points"
                    >
                      +
                    </button>
                  </div>
                  <span>{t('points')}</span>
                </div>
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
  );
};

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <ClientOnly>
        <PageContent />
      </ClientOnly>
    </main>
  );
} 