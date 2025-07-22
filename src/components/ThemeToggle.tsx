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
        return <FaDesktop className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      default:
        return <FaMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'dark':
        return 'Switch to system mode';
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
      className="relative p-3 rounded-xl bg-surface border border-gray-200 border-theme shadow-sm hover:shadow-md hover-bg-theme transition-all duration-200"
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={getLabel()}
      title={`Current: ${theme} theme`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {getIcon()}
      </motion.div>
      
      {/* Theme indicator dot */}
      <div className="absolute -top-1 -right-1">
        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-[#1e1e1e] ${
          theme === 'light' ? 'bg-blue-500' : 
          theme === 'dark' ? 'bg-[#121212]' : 
          'bg-purple-500'
        }`} />
      </div>
    </motion.button>
  );
} 