import { describe, expect, it } from 'vitest';
import { addMonths, applyDates, buildTimeline, groupCauses, monthsBetween } from '@/lib/timeline';
import { defaultPlanningDates, defaultSharedCriteria, newJob } from '@/lib/types';

const shared = (o = {}) =>
  ({ ...defaultSharedCriteria, age: '25-32', english: 'ielts8', education: 'bachelor', partnerStatus: 'single', ...o });
const dates = (o = {}) => ({ ...defaultPlanningDates, ...o });
const job = (o = {}) => ({ ...newJob(), anzsco: '261313', ...o });

describe('month math', () => {
  it('adds across year boundaries', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -2)).toBe('2025-11');
  });
  it('measures signed distance', () => {
    expect(monthsBetween('2026-07', '2027-01')).toBe(6);
    expect(monthsBetween('2027-01', '2026-07')).toBe(-6);
  });
});

describe('applyDates', () => {
  it('derives the age bracket from birth as of a date', () => {
    // Born 1995-03: turns 33 in 2028-03
    expect(applyDates(shared(), [], dates({ birth: '1995-03' }), '2028-02').shared.age).toBe('25-32');
    expect(applyDates(shared(), [], dates({ birth: '1995-03' }), '2028-03').shared.age).toBe('33-39');
  });
  it('derives work brackets, treating future starts as zero years', () => {
    const j = job({ ausWorkStart: '2026-06' });
    expect(applyDates(shared(), [j], dates(), '2027-06').jobs[0].ausWork).toBe('1-3');
    expect(applyDates(shared(), [j], dates(), '2026-01').jobs[0].ausWork).toBe('');
  });
  it('leaves manual brackets alone when no date is set', () => {
    const j = job({ ausWork: '3-5' });
    expect(applyDates(shared(), [j], dates(), '2030-01').jobs[0].ausWork).toBe('3-5');
  });
});

describe('buildTimeline', () => {
  const today = '2026-07';

  it('returns no events without any dates', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job()], dates: dates(), today });
    expect(r.events).toEqual([]);
  });

  it('emits an age-drop event with criteria-derived delta', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job()], dates: dates({ birth: '1995-03' }), today });
    const drop = r.events.find((e) => e.causes.some((c) => c.kind === 'age'));
    expect(drop?.date).toBe('2028-03');
    expect(drop?.delta).toBe(-5); // 30 → 25 from sharedSelectCriteria
  });

  it('emits work milestones per assessment', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job({ overseasWorkStart: '2021-11' })], dates: dates(), today });
    const m = r.events.find((e) => e.causes.some((c) => c.kind === 'overseasWork'));
    expect(m?.date).toBe('2026-11'); // 5 years from 2021-11
    expect(m?.delta).toBe(5);        // 3-5 (5) → 5-8 (10)
  });

  it('emits expiry warnings with zero delta', () => {
    const r = buildTimeline({
      shared: shared(),
      jobs: [job({ assessmentDate: '2025-09' })],
      dates: dates({ englishTest: '2024-06' }),
      today,
    });
    const eng = r.events.find((e) => e.causes.some((c) => c.kind === 'englishExpiry'));
    expect(eng?.date).toBe('2027-06');
    expect(eng?.delta).toBe(0);
    expect(eng?.warning).toBe(true);
    const acs = r.events.find((e) => e.causes.some((c) => c.kind === 'assessmentExpiry'));
    expect(acs?.date).toBe('2027-09'); // ACS = 2 years
  });

  it('merges same-month causes into one event', () => {
    // 33rd birthday and a work milestone in the same month
    const r = buildTimeline({
      shared: shared(),
      jobs: [job({ ausWorkStart: '2025-03' })],
      dates: dates({ birth: '1995-03' }),
      today,
    });
    const e = r.events.find((ev) => ev.date === '2028-03');
    expect(e?.causes.length).toBe(2);   // age −5, aus 1→3 yrs +5
    expect(e?.delta).toBe(0);           // net
  });

  it('caps the horizon at the 45th birthday and flags it', () => {
    const r = buildTimeline({ shared: shared(), jobs: [job()], dates: dates({ birth: '1983-01' }), today });
    expect(r.horizonEnd).toBe('2028-01');
    expect(r.endsAt45).toBe(true);
    expect(r.events.at(-1)?.causes[0].kind).toBe('eligibilityEnd');
  });

  it('uses the max base across assessments for scoreAfter', () => {
    const strong = job({ ausWork: '8-10' });
    const weak = job({ anzsco: '233211', ausWorkStart: '2026-01' });
    const r = buildTimeline({ shared: shared(), jobs: [strong, weak], dates: dates(), today });
    // weak job's milestone (+5 on its own card) doesn't beat strong job's base → no event
    expect(r.events.filter((e) => e.delta !== 0)).toEqual([]);
  });

  it('emits a 25th-birthday age event with +5 delta', () => {
    // Born 2003-01, today 2026-07 → turns 25 at 2028-01; bracket rises 18-24 (25 pts) → 25-32 (30 pts)
    const r = buildTimeline({ shared: shared(), jobs: [job()], dates: dates({ birth: '2003-01' }), today });
    const e = r.events.find((ev) => ev.causes.some((c) => c.kind === 'age'));
    expect(e?.date).toBe('2028-01');
    expect(e?.delta).toBe(5);
  });
});

describe('NAATI CCL expiry', () => {
  const today = '2026-07';

  it('credential dated 2023-01 expires 2028-01 (5-year rule)', () => {
    // 2023-01 >= 2022-08 → 60 months validity
    const r = buildTimeline({
      shared: shared({ communityLanguage: true }),
      jobs: [job()],
      dates: dates({ naatiCert: '2023-01' }),
      today,
    });
    const e = r.events.find((ev) => ev.causes.some((c) => c.kind === 'naatiExpiry'));
    expect(e?.date).toBe('2028-01');
    expect(e?.warning).toBe(true);
    expect(e?.delta).toBe(0);
  });

  it('credential dated 2021-06 (3y rule) expires 2024-06 — before today so absent', () => {
    // 2021-06 < 2022-08 → 36 months; 2021-06 + 36m = 2024-06 < today 2026-07
    const r = buildTimeline({
      shared: shared({ communityLanguage: true }),
      jobs: [job()],
      dates: dates({ naatiCert: '2021-06' }),
      today,
    });
    const e = r.events.find((ev) => ev.causes.some((c) => c.kind === 'naatiExpiry'));
    expect(e).toBeUndefined();
  });

  it('credential dated 2022-01 (3y rule) expires 2025-01 — visible with today 2024-01', () => {
    // 2022-01 < 2022-08 → 36 months; 2025-01 is in window when today = 2024-01
    const r = buildTimeline({
      shared: shared({ communityLanguage: true }),
      jobs: [job()],
      dates: dates({ naatiCert: '2022-01' }),
      today: '2024-01',
    });
    const e = r.events.find((ev) => ev.causes.some((c) => c.kind === 'naatiExpiry'));
    expect(e?.date).toBe('2025-01');
    expect(e?.warning).toBe(true);
  });
});

describe('groupCauses', () => {
  it('merges identical causes and collects job tags', () => {
    const groups = groupCauses([
      { kind: 'ausWork', jobTag: 'A', labelKey: 'tl.ausWork', params: { years: 3 } },
      { kind: 'ausWork', jobTag: 'B', labelKey: 'tl.ausWork', params: { years: 3 } },
      { kind: 'age', labelKey: 'tl.age33', params: { age: 33 } },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ labelKey: 'tl.ausWork', params: { years: 3 }, jobTags: ['A', 'B'] });
    expect(groups[1].jobTags).toEqual([]);
  });

  it('keeps causes with different params separate', () => {
    const groups = groupCauses([
      { kind: 'assessmentExpiry', jobTag: 'A', labelKey: 'tl.assessmentExpiry', params: { authority: 'ACS' } },
      { kind: 'assessmentExpiry', jobTag: 'B', labelKey: 'tl.assessmentExpiry', params: { authority: 'VETASSESS' } },
    ]);
    expect(groups).toHaveLength(2);
  });
});
