'use client';

import { Suspense, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import CalculatorForm from '@/components/CalculatorForm';
import '@/app/i18n/client';

// SSR 骨架 — 搜索引擎可抓取的静态内容
function PageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto pt-8 md:pt-12">
      <div className="h-5 w-32 rounded mb-6" style={{ backgroundColor: 'var(--border-primary)' }} />
      <div className="h-9 w-3/4 rounded mb-16" style={{ backgroundColor: 'var(--border-primary)' }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 rounded mb-2" style={{ backgroundColor: 'var(--border-primary)' }} />
            <div className="h-11 rounded-lg" style={{ backgroundColor: 'var(--border-primary)', opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const PageContent = () => {
  const { t, ready } = useTranslation();
  const [totalPoints, setTotalPoints] = useState(0);
  const [goalPoints, setGoalPoints] = useState(65);
  const MIN_POINTS = 65;

  const progress = Math.min((totalPoints / goalPoints) * 100, 100);
  const isBelow = totalPoints < MIN_POINTS;

  // i18n 加载完成前显示骨架
  if (!ready) return <PageSkeleton />;

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-screen">
      {/* Header */}
      <header className="pt-8 pb-12 md:pt-12 md:pb-16">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div
              className="w-px h-4"
              style={{ backgroundColor: 'var(--border-primary)' }}
            />
            <ThemeToggle />
          </div>
        </div>
        <h1
          className="text-2xl md:text-3xl mt-6"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
        >
          {t('title')}
        </h1>
      </header>

      {/* Main content */}
      <div className="grow">
        <CalculatorForm onPointsChange={setTotalPoints} />

        {/* Results */}
        <motion.div
          className="mt-12 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Divider */}
          <div
            className="mb-8"
            style={{ borderTop: '1px solid var(--border-primary)' }}
          />

          {/* Score display */}
          <div className="flex items-baseline justify-between mb-6">
            <span
              className="text-xs font-medium tracking-wide uppercase"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('total')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <motion.span
                key={totalPoints}
                className="text-4xl md:text-5xl font-light tabular-nums"
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--accent)',
                }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {totalPoints}
              </motion.span>
              <span
                className="text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {t('points')}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-1 rounded-full overflow-hidden mb-6"
            style={{ backgroundColor: 'var(--border-primary)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Info row */}
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-tertiary)' }}>
              {t('minimum')}: {MIN_POINTS}
            </span>

            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-tertiary)' }}>
                {t('goal')}:
              </span>
              <div
                className="inline-flex items-center h-8 rounded-lg overflow-hidden border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <button
                  onClick={() => setGoalPoints(prev => Math.max(MIN_POINTS, prev - 5))}
                  className="w-8 h-full flex items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Decrease goal points"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 6h7" /></svg>
                </button>
                <span
                  className="px-2 text-sm font-medium tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {goalPoints}
                </span>
                <button
                  onClick={() => setGoalPoints(prev => Math.min(120, prev + 5))}
                  className="w-8 h-full flex items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Increase goal points"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2.5v7M2.5 6h7" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <AnimatePresence>
            {totalPoints < goalPoints && (
              <motion.p
                className="mt-5 text-sm rounded-lg px-4 py-3"
                style={{
                  color: isBelow ? 'var(--danger)' : 'var(--text-secondary)',
                  backgroundColor: isBelow ? 'var(--danger-bg)' : 'var(--accent-muted)',
                }}
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
              >
                {t('pointsWarning', { points: goalPoints - totalPoints })}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer */}
      <footer
        className="py-8 mt-4 flex flex-col md:flex-row justify-between items-center gap-3"
        style={{ borderTop: '1px solid var(--border-primary)' }}
      >
        <span
          className="text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          &copy; 2025 Built by Henry Chen
        </span>
        <div className="flex items-center gap-4">
          {[
            {
              href: 'https://github.com/Misoto22',
              label: 'GitHub',
              icon: (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              ),
            },
            {
              href: 'https://www.linkedin.com/in/henry-misoto22/',
              label: 'LinkedIn',
              icon: (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              ),
            },
            {
              href: 'https://www.misoto22.com/',
              label: 'Website',
              icon: (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              ),
            },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-150"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default function Home() {
  return (
    <main className="min-h-screen px-6 md:px-8">
      <Suspense fallback={<PageSkeleton />}>
        <PageContent />
      </Suspense>
    </main>
  );
}
