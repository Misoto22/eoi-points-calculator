import { describe, it, expect } from 'vitest';
import {
  calculateSharedPoints,
  calculateJobPoints,
  evaluate,
  findOccupation,
} from '@/lib/points';
import { defaultSharedCriteria, newJob } from '@/lib/types';
import type { JobAssessment, SharedCriteria } from '@/lib/types';
import { occupations } from '@/data/occupations';
import { openListStates, statesListing, stateOccupationLists } from '@/data/stateLists';

function makeShared(overrides: Partial<SharedCriteria> = {}): SharedCriteria {
  return { ...defaultSharedCriteria, ...overrides };
}

function makeJob(overrides: Partial<JobAssessment> = {}): JobAssessment {
  return { ...newJob(), ...overrides };
}

describe('calculateSharedPoints', () => {
  it('returns 0 for empty shared criteria', () => {
    const p = calculateSharedPoints(defaultSharedCriteria);
    expect(Object.values(p).reduce((s, v) => s + v, 0)).toBe(0);
  });

  describe('age', () => {
    it.each([
      ['18-24', 25],
      ['25-32', 30],
      ['33-39', 25],
      ['40-44', 15],
    ])('age %s gives %d points', (age, expected) => {
      expect(calculateSharedPoints(makeShared({ age })).age).toBe(expected);
    });

    it('invalid age gives 0 points', () => {
      expect(calculateSharedPoints(makeShared({ age: '45-49' })).age).toBe(0);
    });
  });

  describe('english', () => {
    it('competent (ielts6) gives 0 points', () => {
      expect(calculateSharedPoints(makeShared({ english: 'ielts6' })).english).toBe(0);
    });
    it('proficient (ielts7) gives 10 points', () => {
      expect(calculateSharedPoints(makeShared({ english: 'ielts7' })).english).toBe(10);
    });
    it('superior (ielts8) gives 20 points', () => {
      expect(calculateSharedPoints(makeShared({ english: 'ielts8' })).english).toBe(20);
    });
  });

  describe('education', () => {
    it.each([
      ['apprenticeship', 10],
      ['cert3', 10],
      ['diploma', 10],
      ['bachelor', 15],
      ['phd', 20],
    ])('%s gives %d points', (education, expected) => {
      expect(calculateSharedPoints(makeShared({ education })).education).toBe(expected);
    });
  });

  describe('partner status', () => {
    it.each([
      ['single', 10],
      ['partnerSkills', 10],
      ['partnerCitizen', 10],
      ['partnerEnglish', 5],
    ])('%s gives %d points', (partnerStatus, expected) => {
      expect(calculateSharedPoints(makeShared({ partnerStatus })).partnerStatus).toBe(expected);
    });
    it('no partner status gives 0', () => {
      expect(calculateSharedPoints(makeShared({ partnerStatus: '' })).partnerStatus).toBe(0);
    });
  });

  describe('shared bonuses', () => {
    it('STEM gives 10', () => {
      expect(calculateSharedPoints(makeShared({ stem: true })).stem).toBe(10);
    });
    it('Australian study gives 5', () => {
      expect(calculateSharedPoints(makeShared({ ausStudy: true })).ausStudy).toBe(5);
    });
    it('regional study gives 5', () => {
      expect(calculateSharedPoints(makeShared({ regionalStudy: true })).regionalStudy).toBe(5);
    });
    it('community language gives 5', () => {
      expect(calculateSharedPoints(makeShared({ communityLanguage: true })).communityLanguage).toBe(5);
    });
  });
});

describe('calculateJobPoints', () => {
  describe('Australian work experience', () => {
    it.each([
      ['1-3', 5],
      ['3-5', 10],
      ['5-8', 15],
      ['8-10', 20],
    ])('%s years gives %d points', (ausWork, expected) => {
      expect(calculateJobPoints(makeJob({ ausWork })).ausWork).toBe(expected);
    });
  });

  describe('overseas work experience', () => {
    it.each([
      ['3-5', 5],
      ['5-8', 10],
      ['8-10', 15],
    ])('%s years gives %d points', (overseasWork, expected) => {
      expect(calculateJobPoints(makeJob({ overseasWork })).overseasWork).toBe(expected);
    });
    it('1-3 years overseas gives 0 points', () => {
      expect(calculateJobPoints(makeJob({ overseasWork: '1-3' })).overseasWork).toBe(0);
    });
  });

  it('professional year gives 5', () => {
    expect(calculateJobPoints(makeJob({ professionalYear: true })).professionalYear).toBe(5);
  });
});

describe('findOccupation', () => {
  it('finds an existing ANZSCO code', () => {
    const occ = findOccupation('261313');
    expect(occ?.en).toBe('Software Engineer');
  });
  it('returns null for empty or unknown codes', () => {
    expect(findOccupation('')).toBeNull();
    expect(findOccupation('999999')).toBeNull();
  });
});

describe('evaluate', () => {
  it('returns 0 best total for a completely empty form', () => {
    const ev = evaluate(defaultSharedCriteria, [makeJob()]);
    expect(ev.bestTotal).toBe(0);
    expect(ev.best).toBeNull();
    expect(ev.sharedTotal).toBe(0);
  });

  it('sums shared points into every job base', () => {
    const shared = makeShared({ age: '25-32', english: 'ielts7', education: 'bachelor' }); // 30+10+15=55
    const ev = evaluate(shared, [makeJob({ ausWork: '3-5' })]); // +10
    expect(ev.sharedTotal).toBe(55);
    expect(ev.jobs[0].base).toBe(65);
  });

  it('189 requires an MLTSSL occupation', () => {
    const shared = makeShared({ age: '25-32', english: 'ielts7', education: 'bachelor', partnerStatus: 'single' }); // 65
    // 261313 Software Engineer is MLTSSL
    const evMltssl = evaluate(shared, [makeJob({ anzsco: '261313' })]);
    const p189 = evMltssl.jobs[0].pathways.find((p) => p.code === '189')!;
    expect(p189.listOk).toBe(true);
    expect(p189.eligible).toBe(true);

    // 135112 ICT Project Manager is STSOL — not valid for 189
    const evStsol = evaluate(shared, [makeJob({ anzsco: '135112' })]);
    const p189b = evStsol.jobs[0].pathways.find((p) => p.code === '189')!;
    expect(p189b.listOk).toBe(false);
    expect(p189b.eligible).toBe(false);
  });

  it('adds the pathway bonus to the base for 190 and 491', () => {
    const shared = makeShared({ age: '25-32' }); // 30
    const ev = evaluate(shared, [makeJob({ anzsco: '261313' })]);
    const paths = ev.jobs[0].pathways;
    expect(paths.find((p) => p.code === '189')!.total).toBe(30);
    expect(paths.find((p) => p.code === '190')!.total).toBe(35);
    expect(paths.find((p) => p.code === '491')!.total).toBe(45);
  });

  it('190/491 list which states can nominate the occupation', () => {
    // 261313 Software Engineer (ICT) is on several state lists
    const ev = evaluate(makeShared({ age: '25-32' }), [makeJob({ anzsco: '261313' })]);
    const p190 = ev.jobs[0].pathways.find((p) => p.code === '190')!;
    expect(p190.states.length).toBeGreaterThan(0);
    expect(p190.states).toEqual(statesListing('261313', '190'));
    // 189 never carries state tags
    expect(ev.jobs[0].pathways.find((p) => p.code === '189')!.states).toEqual([]);
  });

  it('a ROL occupation is ineligible for 190 (federal gate) but eligible for 491', () => {
    // 121111 Aquaculture Farmer is ROL: allowed on 491 only, never 190
    const shared = makeShared({ age: '25-32', english: 'ielts8', education: 'phd', partnerStatus: 'single' }); // 80
    const ev = evaluate(shared, [makeJob({ anzsco: '121111' })]);
    const by = (code: string) => ev.jobs[0].pathways.find((p) => p.code === code)!;
    expect(by('190').listOk).toBe(false); // ROL not in 190 federal lists
    expect(by('190').eligible).toBe(false);
    expect(by('491').listOk).toBe(true); // ROL is on the 491 gate
    expect(by('491').eligible).toBe(true); // open-list states nominate it
  });

  it('picks the highest eligible pathway across multiple jobs', () => {
    const shared = makeShared({ age: '25-32', english: 'ielts7', education: 'bachelor', partnerStatus: 'single' }); // 65
    const jobs = [
      makeJob({ anzsco: '261313' }),                 // MLTSSL, base 65
      makeJob({ anzsco: '221111', ausWork: '3-5' }), // MLTSSL accountant, base 75
    ];
    const ev = evaluate(shared, jobs);
    expect(ev.best).not.toBeNull();
    // Best should come from job B via 491 (+15): 75 + 15 = 90
    expect(ev.best!.total).toBe(90);
    expect(ev.best!.code).toBe('491');
    expect(ev.bestTotal).toBe(90);
  });

  it('falls back to highest base when nothing is eligible', () => {
    // No occupation selected → no pathway eligible, bestTotal = base
    const shared = makeShared({ age: '25-32', english: 'ielts8' }); // 50
    const ev = evaluate(shared, [makeJob()]);
    expect(ev.best).toBeNull();
    expect(ev.bestTotal).toBe(50);
  });

  it('below 65 points is never eligible even with a valid occupation', () => {
    const shared = makeShared({ age: '40-44' }); // 15
    const ev = evaluate(shared, [makeJob({ anzsco: '261313' })]);
    expect(ev.jobs[0].pathways.every((p) => !p.eligible)).toBe(true);
    expect(ev.best).toBeNull();
  });
});

// --- occupation list audit (2026-07) ---
describe('federal classification audit', () => {
  it.each([
    ['262113', 'Systems Administrator'],
    ['261314', 'Software Tester'],
    ['262111', 'Database Administrator'],
  ])('%s (%s) is STSOL: not 189-eligible, still 190/491-eligible', (anzsco) => {
    expect(findOccupation(anzsco)?.list).toBe('STSOL');
    // 65-point applicant so points are not the limiting factor
    const shared = makeShared({ age: '25-32', english: 'ielts7', education: 'bachelor', partnerStatus: 'single' });
    const paths = evaluate(shared, [makeJob({ anzsco })]).jobs[0].pathways;
    const by = (code: string) => paths.find((p) => p.code === code)!;
    expect(by('189').listOk).toBe(false);
    expect(by('189').eligible).toBe(false);
    expect(by('190').listOk).toBe(true);
    expect(by('491').listOk).toBe(true);
  });
});

describe('open-list states (VIC / TAS / NT)', () => {
  it('nominate any occupation, even outside their priority sector groups', () => {
    // 271311 Solicitor is not in the VIC/TAS/NT priority groups, but they have no fixed list
    const states = statesListing('271311', '190');
    for (const s of openListStates) expect(states).toContain(s);
  });

  it('fixed-list states still gate by their curated list', () => {
    const states = statesListing('271311', '190');
    expect(states).toContain('SA'); // SA lists LEGAL
    expect(states).not.toContain('NSW'); // NSW does not
  });
});

describe('bareScore (裸分)', () => {
  it('is the base before nomination, distinct from bestTotal', () => {
    const shared = makeShared({ age: '25-32', english: 'ielts7', education: 'bachelor', partnerStatus: 'single' }); // 65
    const ev = evaluate(shared, [makeJob({ anzsco: '261313' })]); // MLTSSL, base 65
    expect(ev.bareScore).toBe(65); // no +5/+15 nomination bonus
    expect(ev.bestTotal).toBe(80); // best pathway 491 = 65 + 15
    expect(ev.best?.code).toBe('491');
  });

  it('takes the highest base across multiple jobs', () => {
    const shared = makeShared({ age: '25-32' }); // 30
    const ev = evaluate(shared, [
      makeJob({ anzsco: '261313' }), // base 30
      makeJob({ anzsco: '221111', ausWork: '5-8' }), // base 30 + 15 = 45
    ]);
    expect(ev.bareScore).toBe(45);
  });
});

describe('data integrity', () => {
  it('every state list only references known ANZSCO codes', () => {
    const known = new Set(occupations.map((o) => o.anzsco));
    for (const visaLists of Object.values(stateOccupationLists)) {
      for (const codes of Object.values(visaLists)) {
        for (const code of codes) {
          expect(known.has(code)).toBe(true);
        }
      }
    }
  });
});
