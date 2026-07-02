import { describe, expect, it } from 'vitest';
import { mergeQueryString, stateToQueryString } from '@/lib/urlState';
import type { JobAssessment, SharedCriteria } from '@/lib/types';
import { defaultSharedCriteria } from '@/lib/types';

function job(overrides: Partial<JobAssessment> = {}): JobAssessment {
  return { id: 'j1', anzsco: '', ausWork: '', overseasWork: '', professionalYear: false, ...overrides };
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
