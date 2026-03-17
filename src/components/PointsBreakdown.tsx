'use client';

import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { PointsBreakdown as Breakdown } from '@/lib/types';

interface Props {
  breakdown: Breakdown;
}

const CATEGORY_KEYS = [
  'age', 'english', 'ausWork', 'overseasWork', 'education',
  'stem', 'ausStudy', 'communityLanguage', 'professionalYear',
  'stateNomination', 'regionalNomination', 'regionalStudy', 'partnerStatus',
] as const;

export default function PointsBreakdown({ breakdown }: Props) {
  const { t } = useTranslation();

  const activeCategories = CATEGORY_KEYS.filter(key => breakdown[key] > 0);

  if (activeCategories.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h3
        className="text-xs font-medium tracking-wide uppercase mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('breakdown.title')}
      </h3>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {activeCategories.map((key) => (
            <motion.div
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
              style={{ backgroundColor: 'var(--accent-muted)' }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>
                {t(`breakdown.${key}`)}
              </span>
              <span
                className="font-medium"
                style={{ color: 'var(--accent)' }}
              >
                +{breakdown[key]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
