'use client';

import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return <FaSun className="w-5 h-5 text-yellow-500" />;
      case 'light':
        return <FaMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
      case 'system':
        return <FaDesktop className="w-5 h-5 text-blue-500" />;
      default:
        return <FaMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Switch to light mode';
      case 'light':
        return 'Switch to dark mode';
      case 'system':
        return 'Switch to light mode';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <motion.button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={getLabel()}
      title={`Current: ${theme} theme`}
    >
      {getIcon()}
    </motion.button>
  );
} 