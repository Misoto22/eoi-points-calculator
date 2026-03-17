'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { occupations } from '@/data/occupations';
import CollapsibleSection from './CollapsibleSection';

export default function OccupationSearch() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return occupations
      .filter(o =>
        o.anzsco.includes(q) ||
        o.en.toLowerCase().includes(q) ||
        o.zh.includes(q)
      )
      .slice(0, 10);
  }, [query]);

  const listColor = (list: string) => {
    switch (list) {
      case 'MLTSSL': return 'var(--accent)';
      case 'STSOL': return 'var(--text-secondary)';
      case 'ROL': return 'var(--text-tertiary)';
      default: return 'var(--text-tertiary)';
    }
  };

  const isZh = i18n.language === 'zh';

  return (
    <CollapsibleSection title={t('occupation.title')}>
      <div className="space-y-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('occupation.search')}
          className="w-full h-10 px-3 rounded-lg text-sm border transition-colors duration-150"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        />

        {query.trim() && (
          <div className="space-y-1">
            {results.length === 0 ? (
              <p className="text-sm py-2" style={{ color: 'var(--text-tertiary)' }}>
                {t('occupation.noResults')}
              </p>
            ) : (
              results.map((occ) => (
                <div
                  key={occ.anzsco}
                  className="flex items-center justify-between py-2 px-2 rounded-md text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-xs tabular-nums shrink-0"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {occ.anzsco}
                    </span>
                    <span className="truncate">{isZh ? occ.zh : occ.en}</span>
                  </div>
                  <span
                    className="text-xs font-medium shrink-0 ml-2 px-1.5 py-0.5 rounded"
                    style={{
                      color: listColor(occ.list),
                      backgroundColor: occ.list === 'MLTSSL' ? 'var(--accent-muted)' : 'transparent',
                    }}
                  >
                    {occ.list}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {t('occupation.hint')}
        </p>
      </div>
    </CollapsibleSection>
  );
}
