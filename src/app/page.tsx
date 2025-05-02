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
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-2rem)]">
      <div className="flex-grow">
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
                  <div className="flex items-center space-x-2">
                    <div className="inline-flex items-center h-8 bg-white dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                      <button
                        onClick={() => setGoalPoints(prev => Math.max(MIN_POINTS, prev - 5))}
                        className="w-8 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                        aria-label="Decrease goal points"
                      >
                        -
                      </button>
                      <span className="px-3 font-medium text-gray-900 dark:text-gray-100">
                        {goalPoints}
                      </span>
                      <button
                        onClick={() => setGoalPoints(prev => Math.min(120, prev + 5))}
                        className="w-8 h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                        aria-label="Increase goal points"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">{t('points')}</span>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {totalPoints < goalPoints && (
                  <motion.div 
                    className={`mt-4 p-3 rounded-md text-sm ${
                      totalPoints < MIN_POINTS 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
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

      <footer className="mt-8 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 EOI Points Calculator. Built by Henry Chen.
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/Misoto22"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/henry-misoto22/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href="https://www.misoto22.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Personal Website"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
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