'use client';

import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="3.5" />
            <path d="M8 1.5v1M8 13.5v1M2.75 2.75l.7.7M12.55 12.55l.7.7M1.5 8h1M13.5 8h1M2.75 13.25l.7-.7M12.55 3.45l.7-.7" />
          </svg>
        );
      case 'light':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.5 8.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7Z" />
          </svg>
        );
      case 'system':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="12" height="9" rx="1.5" />
            <path d="M6 14.5h4M8 12v2.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'dark': return 'Switch to system mode';
      case 'light': return 'Switch to dark mode';
      case 'system': return 'Switch to light mode';
      default: return 'Toggle theme';
    }
  };

  return (
    <motion.button
      onClick={cycleTheme}
      className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
      whileTap={{ scale: 0.95 }}
      aria-label={getLabel()}
      title={`Current: ${theme} theme`}
    >
      <motion.div
        key={theme}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        {getIcon()}
      </motion.div>
    </motion.button>
  );
}
