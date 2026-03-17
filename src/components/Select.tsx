'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (e: { target: { name: string; value: string; type: string } }) => void;
}

export default function Select({ name, value, options, placeholder, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (optValue: string) => {
    onChange({ target: { name, value: optValue, type: 'select' } });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full h-11 px-3 pr-9 rounded-lg text-sm text-left transition-all duration-150 border flex items-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: open ? 'var(--accent)' : 'var(--border-primary)',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          boxShadow: open ? '0 0 0 1px var(--accent)' : 'none',
        }}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-150"
          style={{
            color: 'var(--text-tertiary)',
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          }}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="absolute z-50 w-full mt-1.5 py-1 rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-primary)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            }}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className="w-full px-3 py-2.5 text-sm text-left transition-colors duration-100 flex items-center justify-between"
                  style={{
                    color: opt.value === value ? 'var(--accent)' : 'var(--text-primary)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3.5 8.5 3 3 6-7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
