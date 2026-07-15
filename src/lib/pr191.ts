import { addMonths, monthsBetween } from './timeline';
import { isYm } from './types';
import { PR191_HOLDING_YEARS } from '@/data/pr191';

export interface Pr191Projection {
  /** Earliest month the 3-year holding requirement is met (YYYY-MM) */
  eligibleFrom: string;
  monthsRemaining: number;
  isEligibleNow: boolean;
}

/**
 * Earliest possible subclass 191 eligibility date from a 491/494 grant month,
 * assuming continuous regional-compliant residence (condition 8579) —
 * the calculator has no way to verify actual compliance or income-year
 * lodgement, so this is a best case, not a guarantee.
 */
export function projectPr191(grantMonth: string, today: string): Pr191Projection | null {
  if (!isYm(grantMonth)) return null;
  const eligibleFrom = addMonths(grantMonth, PR191_HOLDING_YEARS * 12);
  const monthsRemaining = Math.max(0, monthsBetween(today, eligibleFrom));
  return { eligibleFrom, monthsRemaining, isEligibleNow: monthsRemaining === 0 };
}
