import { describe, expect, it } from 'vitest';
import { buildOgQuery } from '@/lib/og';
import { defaultPlanningDates, defaultSharedCriteria, newJob } from '@/lib/types';

const state = (jobs = [newJob()]) => ({
  shared: { ...defaultSharedCriteria, age: '25-32', english: 'ielts8', education: 'bachelor', partnerStatus: 'single' },
  jobs,
  dates: { ...defaultPlanningDates },
});

describe('buildOgQuery', () => {
  it('carries the bare score and language', () => {
    const q = new URLSearchParams(buildOgQuery(state(), 'zh-CN'));
    expect(q.get('s')).toBe('75');
    expect(q.get('l')).toBe('zh');
  });

  it('lists English occupation names and eligible pathway codes', () => {
    const j = { ...newJob(), anzsco: '261313' };
    const q = new URLSearchParams(buildOgQuery(state([j]), null));
    expect(q.get('occ')).toBe('Software Engineer');
    expect(q.get('e')).toContain('189');
    expect(q.get('l')).toBe('en');
  });
});
