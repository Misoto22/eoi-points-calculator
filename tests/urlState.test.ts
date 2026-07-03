import { describe, expect, it } from 'vitest';
import { mergeQueryString, parseStateFromParams, stateToQueryString } from '@/lib/urlState';
import type { JobAssessment, SharedCriteria } from '@/lib/types';
import { defaultPlanningDates, defaultSharedCriteria } from '@/lib/types';
import type { PlanningDates } from '@/lib/types';

function job(overrides: Partial<JobAssessment> = {}): JobAssessment {
  return { id: 'j1', anzsco: '', ausWork: '', overseasWork: '', professionalYear: false, ausWorkStart: '', ausWorkEnd: '', overseasWorkStart: '', overseasWorkEnd: '', assessmentDate: '', ...overrides };
}

function dates(overrides: Partial<PlanningDates> = {}): PlanningDates {
  return { ...defaultPlanningDates, ...overrides };
}

function shared(overrides: Partial<SharedCriteria> = {}): SharedCriteria {
  return { ...defaultSharedCriteria, ...overrides };
}

describe('stateToQueryString', () => {
  it('serialises shared criteria and non-empty jobs', () => {
    const qs = stateToQueryString(
      shared({ age: '25-32', stem: true }),
      [job({ anzsco: '261313', ausWork: '3-5' })],
    );
    const params = new URLSearchParams(qs);
    expect(params.get('a')).toBe('25-32');
    expect(params.get('s')).toBe('1');
    expect(params.get('jobs')).toBe('261313:3-5::0');
  });

  it('omits empty jobs entirely', () => {
    expect(stateToQueryString(shared(), [job()])).toBe('');
  });
});

describe('mergeQueryString', () => {
  it('preserves foreign params such as lng', () => {
    const qs = mergeQueryString('?lng=zh', shared({ age: '25-32' }), [job()]);
    const params = new URLSearchParams(qs);
    expect(params.get('lng')).toBe('zh');
    expect(params.get('a')).toBe('25-32');
  });

  it('replaces stale state params instead of stacking them', () => {
    const qs = mergeQueryString('?a=18-24&jobs=111111:::0', shared({ age: '25-32' }), [job()]);
    const params = new URLSearchParams(qs);
    expect(params.get('a')).toBe('25-32');
    expect(params.get('jobs')).toBeNull();
  });

  it('drops state params when state is emptied but keeps foreign ones', () => {
    const qs = mergeQueryString('?lng=zh&a=25-32&jobs=261313:::0', shared(), [job()]);
    expect(qs).toBe('lng=zh');
  });

  it('returns an empty string when there is nothing to keep', () => {
    expect(mergeQueryString('', shared(), [job()])).toBe('');
  });
});

describe('date serialisation', () => {
  it('round-trips shared dates via b/et/nc params', () => {
    const qs = stateToQueryString(shared({ age: '25-32' }), [job()], dates({ birth: '1995-03', englishTest: '2024-03' }));
    const params = new URLSearchParams(qs);
    expect(params.get('b')).toBe('1995-03');
    expect(params.get('et')).toBe('2024-03');
    expect(params.get('nc')).toBeNull();
    const state = parseStateFromParams(params);
    expect(state?.dates).toEqual(dates({ birth: '1995-03', englishTest: '2024-03' }));
  });

  it('appends job dates as segments 5-7 and trims trailing empties', () => {
    const j = job({ anzsco: '261313', ausWorkStart: '2026-06', overseasWorkStart: '2021-11' });
    const qs = stateToQueryString(shared(), [j], dates());
    expect(new URLSearchParams(qs).get('jobs')).toBe('261313:::0:2026-06:2021-11');
  });

  it('parses old-format jobs params without date segments', () => {
    const state = parseStateFromParams(new URLSearchParams('jobs=261313:3-5::1'));
    expect(state?.jobs[0].anzsco).toBe('261313');
    expect(state?.jobs[0].ausWorkStart).toBe('');
    expect(state?.jobs[0].assessmentDate).toBe('');
  });

  it('rejects malformed date params instead of storing them', () => {
    const state = parseStateFromParams(new URLSearchParams('b=hello&a=25-32'));
    expect(state?.dates.birth).toBe('');
  });

  it('mergeQueryString keeps foreign params alongside dates', () => {
    const qs = mergeQueryString('?lng=zh', shared(), [job()], dates({ birth: '1995-03' }));
    const params = new URLSearchParams(qs);
    expect(params.get('lng')).toBe('zh');
    expect(params.get('b')).toBe('1995-03');
  });
});
