import { describe, expect, it } from 'vitest';
import { projectPr191 } from '@/lib/pr191';

describe('projectPr191', () => {
  it('returns null for an empty or invalid grant month', () => {
    expect(projectPr191('', '2026-07')).toBeNull();
    expect(projectPr191('not-a-date', '2026-07')).toBeNull();
  });

  it('projects eligibility 3 years after the grant month', () => {
    const p = projectPr191('2024-03', '2026-07')!;
    expect(p.eligibleFrom).toBe('2027-03');
    expect(p.isEligibleNow).toBe(false);
    expect(p.monthsRemaining).toBe(8);
  });

  it('reports eligible now once 3 years have passed', () => {
    const p = projectPr191('2023-01', '2026-07')!;
    expect(p.eligibleFrom).toBe('2026-01');
    expect(p.isEligibleNow).toBe(true);
    expect(p.monthsRemaining).toBe(0);
  });

  it('clamps months remaining at zero for a grant well in the past', () => {
    const p = projectPr191('2018-01', '2026-07')!;
    expect(p.monthsRemaining).toBe(0);
    expect(p.isEligibleNow).toBe(true);
  });
});
