'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
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
  label?: string;
  onChange: (e: { target: { name: string; value: string; type: string } }) => void;
}

export default function Select({ name, value, options, placeholder, label, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;

  // 检测触屏设备
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label;

  // 当前选中项在 options 中的索引
  const selectedIndex = options.findIndex(o => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // 打开时初始化高亮到当前选中项
  useEffect(() => {
    if (open) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [open, selectedIndex]);

  // 滚动高亮项到可见区域
  useEffect(() => {
    if (open && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open]);

  const handleSelect = useCallback((optValue: string) => {
    onChange({ target: { name, value: optValue, type: 'select' } });
    setOpen(false);
  }, [name, onChange]);

  const handleClear = useCallback(() => {
    onChange({ target: { name, value: '', type: 'select' } });
  }, [name, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else {
          setOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
        }
        break;
    }
  }, [open, highlightedIndex, options, handleSelect]);

  // 移动端使用原生 select
  if (isTouchDevice) {
    return (
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange({ target: { name, value: e.target.value, type: 'select' } })}
          aria-label={label || placeholder}
          className="w-full h-11 px-3 pr-9 rounded-lg text-sm border appearance-none transition-colors duration-150"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-primary)',
            color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-tertiary)' }}
          width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        role="combobox"
        aria-label={label || placeholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          open && highlightedIndex >= 0
            ? `${id}-option-${highlightedIndex}`
            : undefined
        }
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full h-11 px-3 rounded-lg text-sm text-left transition-all duration-150 border flex items-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: open ? 'var(--accent)' : 'var(--border-primary)',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          boxShadow: open ? '0 0 0 1px var(--accent)' : 'none',
          paddingRight: value ? '3.25rem' : '2.25rem',
        }}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>

        {/* Clear button — inside the box, left of chevron */}
        {value && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded transition-colors duration-100 hover:bg-[var(--bg-surface-hover)]"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label={`Clear ${name}`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </span>
        )}

        <svg
          className="absolute right-3 top-1/2 transition-transform duration-150"
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
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={placeholder}
            className="absolute z-50 w-full mt-1.5 py-1 rounded-lg border overflow-auto max-h-60"
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
            {options.map((opt, index) => (
              <li
                key={opt.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className="w-full px-3 py-2.5 text-sm text-left transition-colors duration-75 flex items-center justify-between cursor-pointer"
                style={{
                  color: opt.value === value ? 'var(--accent)' : 'var(--text-primary)',
                  backgroundColor: highlightedIndex === index ? 'var(--bg-surface-hover)' : 'transparent',
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
                    aria-hidden="true"
                  >
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
