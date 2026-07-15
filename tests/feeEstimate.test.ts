import { describe, expect, it } from 'vitest';
import { estimateFees } from '@/lib/feeEstimate';
import { evaluate } from '@/lib/points';
import { defaultSharedCriteria, newJob } from '@/lib/types';
import type { JobAssessment, SharedCriteria } from '@/lib/types';
import { visaApplicationCharge, secondaryApplicantCharge, naatiCclFee } from '@/data/fees';

function makeShared(overrides: Partial<SharedCriteria> = {}): SharedCriteria {
  return { ...defaultSharedCriteria, ...overrides };
}

function makeJob(overrides: Partial<JobAssessment> = {}): JobAssessment {
  return { ...newJob(), ...overrides };
}

describe('estimateFees', () => {
  it('has no visa charge and no assessment lines with nothing selected', () => {
    const ev = evaluate(makeShared(), [makeJob()]);
    const fee = estimateFees(ev, makeShared());
    expect(fee.visaCharge).toBeNull();
    expect(fee.assessments).toEqual([]);
    expect(fee.nominationFeeRange).toBeNull();
  });

  it('charges the best eligible pathway\'s visa application charge', () => {
    const shared = makeShared({ age: '25-32', english: 'ielts7', education: 'bachelor', partnerStatus: 'single' }); // 65
    const ev = evaluate(shared, [makeJob({ anzsco: '261313' })]); // Software Engineer, MLTSSL
    const fee = estimateFees(ev, shared);
    expect(ev.best?.code).toBe('491'); // highest bonus pathway wins
    expect(fee.visaCharge).toBe(visaApplicationCharge['491']);
  });

  it('adds the partner charge only for partner-implying statuses', () => {
    const shared = makeShared({ age: '25-32', english: 'ielts7', education: 'bachelor', partnerStatus: 'partnerSkills' });
    const ev = evaluate(shared, [makeJob({ anzsco: '261313' })]);
    const fee = estimateFees(ev, shared);
    expect(fee.partnerCharge).toBe(secondaryApplicantCharge.partner);

    const single = makeShared({ ...shared, partnerStatus: 'single' });
    const evSingle = evaluate(single, [makeJob({ anzsco: '261313' })]);
    expect(estimateFees(evSingle, single).partnerCharge).toBe(0);
  });

  it('looks up a known assessment fee by authority (261313 -> ACS)', () => {
    const shared = makeShared({ age: '25-32' });
    const ev = evaluate(shared, [makeJob({ anzsco: '261313' })]);
    const fee = estimateFees(ev, shared);
    expect(fee.assessments).toHaveLength(1);
    expect(fee.assessments[0].authority).toBe('ACS');
    expect(fee.assessments[0].fee).not.toBeNull();
    expect(fee.assessments[0].range).toBeNull();
  });

  it('adds the NAATI fee only when communityLanguage is claimed', () => {
    const shared = makeShared({ communityLanguage: true });
    const ev = evaluate(shared, [makeJob()]);
    expect(estimateFees(ev, shared).naatiFee).toBe(naatiCclFee);
    expect(estimateFees(evaluate(makeShared(), [makeJob()]), makeShared()).naatiFee).toBe(0);
  });

  it('totalHigh is never less than totalLow', () => {
    const shared = makeShared({ age: '25-32', english: 'ielts8', education: 'phd', partnerStatus: 'partnerCitizen', communityLanguage: true });
    const ev = evaluate(shared, [makeJob({ anzsco: '271311' })]); // Solicitor -> SLAA fallback range
    const fee = estimateFees(ev, shared);
    expect(fee.totalHigh).toBeGreaterThanOrEqual(fee.totalLow);
  });
});
