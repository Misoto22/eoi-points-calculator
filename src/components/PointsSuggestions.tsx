'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FormData, PointsBreakdown } from '@/lib/types';

interface Props {
  formData: FormData;
  breakdown: PointsBreakdown;
  goalPoints: number;
}

interface Suggestion {
  key: string;
  points: number;
}

export default function PointsSuggestions({ formData, breakdown, goalPoints }: Props) {
  const { t } = useTranslation();

  const suggestions = useMemo(() => {
    if (breakdown.total >= goalPoints) return [];

    const tips: Suggestion[] = [];

    // 英语可以提升
    if (formData.english === 'ielts6' || formData.english === 'ielts7') {
      const target = formData.english === 'ielts6' ? 'ielts7' : 'ielts8';
      const gain = target === 'ielts7' ? 10 : 10;
      tips.push({ key: `suggestion.english.${target}`, points: gain });
    }
    if (!formData.english) {
      tips.push({ key: 'suggestion.english.ielts8', points: 20 });
    }

    // 没选 STEM
    if (!formData.stem && (formData.education === 'phd' || formData.education === 'bachelor')) {
      tips.push({ key: 'suggestion.stem', points: 10 });
    }

    // 没选职业年
    if (!formData.professionalYear) {
      tips.push({ key: 'suggestion.professionalYear', points: 5 });
    }

    // 没选 NAATI
    if (!formData.communityLanguage) {
      tips.push({ key: 'suggestion.naati', points: 5 });
    }

    // 没选澳洲学习
    if (!formData.ausStudy) {
      tips.push({ key: 'suggestion.ausStudy', points: 5 });
    }

    // 没选偏远地区担保（比州担保多 10 分）
    if (formData.stateNomination && !formData.regionalNomination) {
      tips.push({ key: 'suggestion.regional', points: 10 });
    }

    // 按分值排序，取前 3 个
    return tips.sort((a, b) => b.points - a.points).slice(0, 3);
  }, [formData, breakdown.total, goalPoints]);

  if (suggestions.length === 0) return null;

  return (
    <div
      className="text-sm rounded-lg px-4 py-3 space-y-1"
      style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--text-secondary)' }}
    >
      <p className="font-medium text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        {t('suggestion.title')}
      </p>
      {suggestions.map((s) => (
        <p key={s.key} className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-light)' }}
          >
            +{s.points}
          </span>
          <span>{t(s.key)}</span>
        </p>
      ))}
    </div>
  );
}
