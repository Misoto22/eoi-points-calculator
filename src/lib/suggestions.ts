import type { Evaluation } from './points';
import type { SharedCriteria } from './types';
import {
  optionPoints,
  professionalYearPoints,
  sharedBonusCriteria,
  sharedSelectCriteria,
} from '@/data/pointsCriteria';

export interface Suggestion {
  /** i18n key under `sug.` */
  key: string;
  points: number;
}

const MAX_SUGGESTIONS = 3;

/** Actionable ways to gain points, sorted by impact. Empty once the goal is met. */
export function suggestionsFor(evaluation: Evaluation, shared: SharedCriteria, goal: number): Suggestion[] {
  if (evaluation.bestTotal >= goal && evaluation.best) return [];

  const english = sharedSelectCriteria.english;
  const englishPoints = (value: string) => optionPoints(english, value);
  const tips: Suggestion[] = [];

  if (!shared.english) {
    tips.push({ key: 'ielts8', points: englishPoints('ielts8') });
  } else if (shared.english === 'ielts6') {
    tips.push({ key: 'ielts7', points: englishPoints('ielts7') - englishPoints('ielts6') });
  } else if (shared.english === 'ielts7') {
    tips.push({ key: 'ielts8', points: englishPoints('ielts8') - englishPoints('ielts7') });
  }

  if (!shared.stem && (shared.education === 'phd' || shared.education === 'bachelor')) {
    tips.push({ key: 'stem', points: sharedBonusCriteria.stem });
  }

  const bestJob = evaluation.best ? evaluation.best.job : evaluation.jobs[0];
  if (bestJob && !bestJob.job.professionalYear) {
    tips.push({ key: 'professionalYear', points: professionalYearPoints });
  }

  if (!shared.communityLanguage) {
    tips.push({ key: 'naati', points: sharedBonusCriteria.communityLanguage });
  }
  if (!shared.ausStudy) {
    tips.push({ key: 'ausStudy', points: sharedBonusCriteria.ausStudy });
  }

  const hasMltssl = evaluation.jobs.some((je) => je.occupation?.list === 'MLTSSL');
  if (!hasMltssl && evaluation.jobs.some((je) => je.occupation)) {
    tips.push({ key: 'mltssl', points: 0 });
  }

  return tips.sort((a, b) => b.points - a.points).slice(0, MAX_SUGGESTIONS);
}
