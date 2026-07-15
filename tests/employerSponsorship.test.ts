import { describe, expect, it } from 'vitest';
import {
  GATE_LABEL_KEY,
  STREAM_LABEL_KEY,
  ageYearsFromBirth,
  estimateExperienceYears,
  evaluateSponsorship,
  isSpecialistEligibleGroup,
} from '@/lib/employerSponsorship';
import { defaultSharedCriteria, defaultSponsorshipInputs, newJob } from '@/lib/types';
import type { JobAssessment, SponsorshipInputs } from '@/lib/types';
import { isCsolListed } from '@/data/csol';
import { sponsorshipStreams } from '@/data/sponsorship';

const TODAY = '2026-07';

function job(patch: Partial<JobAssessment>): JobAssessment {
  return { ...newJob(), ...patch };
}

describe('isCsolListed', () => {
  it('is true for a known CSOL occupation and false for a non-CSOL occupation', () => {
    expect(isCsolListed('261313')).toBe(true); // Software Engineer
    expect(isCsolListed('134111')).toBe(false); // Child Care Centre Manager — MLTSSL but not CSOL
  });

  it('rejects an empty code', () => {
    expect(isCsolListed('')).toBe(false);
  });
});

describe('isSpecialistEligibleGroup', () => {
  it('excludes ANZSCO major groups 3, 7 and 8', () => {
    expect(isSpecialistEligibleGroup('341111')).toBe(false); // Electrician — group 3
    expect(isSpecialistEligibleGroup('711111')).toBe(false); // group 7
    expect(isSpecialistEligibleGroup('811111')).toBe(false); // group 8
  });

  it('includes groups 1, 2, 4, 5 and 6', () => {
    for (const prefix of ['1', '2', '4', '5', '6']) {
      expect(isSpecialistEligibleGroup(`${prefix}11111`)).toBe(true);
    }
  });

  it('rejects an empty code', () => {
    expect(isSpecialistEligibleGroup('')).toBe(false);
  });
});

describe('estimateExperienceYears', () => {
  it('sums the Australian and overseas bracket minimums', () => {
    expect(estimateExperienceYears(job({ ausWork: '1-3', overseasWork: '' }))).toBe(1);
    expect(estimateExperienceYears(job({ ausWork: '3-5', overseasWork: '3-5' }))).toBe(6);
    expect(estimateExperienceYears(job({ ausWork: '8-10', overseasWork: '8-10' }))).toBe(16);
  });

  it('is zero when neither field is set', () => {
    expect(estimateExperienceYears(job({}))).toBe(0);
  });
});

describe('ageYearsFromBirth', () => {
  it('returns null for an empty or invalid month', () => {
    expect(ageYearsFromBirth('', TODAY)).toBeNull();
    expect(ageYearsFromBirth('not-a-date', TODAY)).toBeNull();
  });

  it('computes whole years elapsed', () => {
    expect(ageYearsFromBirth('1996-07', TODAY)).toBe(30);
    expect(ageYearsFromBirth('1980-01', TODAY)).toBe(46);
  });
});

describe('evaluateSponsorship', () => {
  const eligibleInputs: SponsorshipInputs = { hasSponsor: true, salaryBand: 'ssitPlus', trtEligible: false };

  it('clears 482 Core and Specialist Skills when every gate is met', () => {
    const j = job({ anzsco: '261313', ausWork: '1-3', overseasWork: '' }); // Software Engineer, group 2, CSOL-listed
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const result = evaluateSponsorship([j], shared, eligibleInputs, '1996-07', TODAY);
    const [core, specialist] = result.jobs[0].streams;
    expect(core.eligible).toBe(true);
    expect(specialist.eligible).toBe(true);
  });

  it('fails 482 Specialist Skills for a Technicians/Trades occupation even with a high salary', () => {
    const j = job({ anzsco: '341111', ausWork: '3-5' }); // Electrician (General), group 3, CSOL-listed
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const result = evaluateSponsorship([j], shared, eligibleInputs, '1996-07', TODAY);
    const specialist = result.jobs[0].streams.find((s) => s.code === '482specialist')!;
    expect(specialist.eligible).toBe(false);
    expect(specialist.gates.find((g) => g.key === 'specialistGroup')?.ok).toBe(false);
    // Core Skills stream is unaffected by the major-group exclusion
    const core = result.jobs[0].streams.find((s) => s.code === '482core')!;
    expect(core.eligible).toBe(true);
  });

  it('fails the CSOL gate for an occupation outside the Core Skills Occupation List', () => {
    const j = job({ anzsco: '134111', ausWork: '3-5' }); // Child Care Centre Manager — not on CSOL
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const result = evaluateSponsorship([j], shared, eligibleInputs, '1996-07', TODAY);
    const core = result.jobs[0].streams.find((s) => s.code === '482core')!;
    const direct = result.jobs[0].streams.find((s) => s.code === '186direct')!;
    expect(core.gates.find((g) => g.key === 'csol')?.ok).toBe(false);
    expect(direct.gates.find((g) => g.key === 'csol')?.ok).toBe(false);
    // Specialist Skills doesn't gate on CSOL — group 1 (Managers) still passes that check
    const specialist = result.jobs[0].streams.find((s) => s.code === '482specialist')!;
    expect(specialist.gates.find((g) => g.key === 'specialistGroup')?.ok).toBe(true);
  });

  it('requires 3 years of experience for 186 Direct Entry but only 1 for 482 streams', () => {
    const j = job({ anzsco: '261313', ausWork: '1-3', overseasWork: '' }); // 1 year total
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const result = evaluateSponsorship([j], shared, eligibleInputs, '1996-07', TODAY);
    const core = result.jobs[0].streams.find((s) => s.code === '482core')!;
    const direct = result.jobs[0].streams.find((s) => s.code === '186direct')!;
    expect(core.eligible).toBe(true);
    expect(direct.eligible).toBe(false);
    expect(direct.gates.find((g) => g.key === 'experience')?.params).toEqual({ years: 3 });
  });

  it('applies the under-45 age ceiling to both 186 streams but not to 482', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const trtInputs: SponsorshipInputs = { ...eligibleInputs, trtEligible: true };
    const result = evaluateSponsorship([j], shared, trtInputs, '1980-01', TODAY); // age 46
    const [core, , direct, trt] = result.jobs[0].streams;
    expect(result.ageYears).toBe(46);
    expect(core.eligible).toBe(true); // 482 has no age gate
    expect(direct.gates.find((g) => g.key === 'ageLimit')?.ok).toBe(false);
    expect(trt.gates.find((g) => g.key === 'ageLimit')?.ok).toBe(false);
  });

  it('clears 186 TRT on trtEligible + CSIT salary, independent of occupation or CSOL', () => {
    const j = job({ anzsco: '134111' }); // not CSOL-listed, no work brackets set
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const trtInputs: SponsorshipInputs = { hasSponsor: false, salaryBand: 'ssitPlus', trtEligible: true };
    const result = evaluateSponsorship([j], shared, trtInputs, '1996-07', TODAY);
    const trt = result.jobs[0].streams.find((s) => s.code === '186trt')!;
    expect(trt.eligible).toBe(true);
  });

  it('requires the CSIT salary gate for both 186 Direct Entry and TRT', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const belowCsit: SponsorshipInputs = { hasSponsor: true, salaryBand: 'belowCsit', trtEligible: true };
    const result = evaluateSponsorship([j], shared, belowCsit, '1996-07', TODAY);
    const direct = result.jobs[0].streams.find((s) => s.code === '186direct')!;
    const trt = result.jobs[0].streams.find((s) => s.code === '186trt')!;
    expect(direct.eligible).toBe(false);
    expect(direct.gates.find((g) => g.key === 'salaryCsit')?.ok).toBe(false);
    expect(trt.eligible).toBe(false);
    expect(trt.gates.find((g) => g.key === 'salaryCsit')?.ok).toBe(false);
  });

  it('falls back to the points-test age bracket to confirm under-45 when no birth month is entered', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const shared = { ...defaultSharedCriteria, english: 'ielts6', age: '25-32' };
    const trtInputs: SponsorshipInputs = { hasSponsor: true, salaryBand: 'ssitPlus', trtEligible: true };
    const result = evaluateSponsorship([j], shared, trtInputs, '', TODAY);
    expect(result.ageYears).toBeNull();
    expect(result.ageUnder45).toBe(true);
    const direct = result.jobs[0].streams.find((s) => s.code === '186direct')!;
    const trt = result.jobs[0].streams.find((s) => s.code === '186trt')!;
    expect(direct.gates.find((g) => g.key === 'ageLimit')?.ok).toBe(true);
    expect(trt.gates.find((g) => g.key === 'ageLimit')?.ok).toBe(true);
  });

  it('fails every stream but TRT when there is no sponsor', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const noSponsor: SponsorshipInputs = { hasSponsor: false, salaryBand: 'ssitPlus', trtEligible: false };
    const result = evaluateSponsorship([j], shared, noSponsor, '1996-07', TODAY);
    const [core, specialist, direct] = result.jobs[0].streams;
    expect(core.eligible).toBe(false);
    expect(specialist.eligible).toBe(false);
    expect(direct.eligible).toBe(false);
  });

  it('distinguishes the CSIT-only salary band from the SSIT band', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const csitOnly: SponsorshipInputs = { hasSponsor: true, salaryBand: 'csitToSsit', trtEligible: false };
    const result = evaluateSponsorship([j], shared, csitOnly, '1996-07', TODAY);
    const core = result.jobs[0].streams.find((s) => s.code === '482core')!;
    const specialist = result.jobs[0].streams.find((s) => s.code === '482specialist')!;
    expect(core.eligible).toBe(true);
    expect(specialist.eligible).toBe(false);
    expect(specialist.gates.find((g) => g.key === 'salarySsit')?.ok).toBe(false);
  });

  it('treats an unset English level as not meeting any stream\'s English gate', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const result = evaluateSponsorship([j], defaultSharedCriteria, eligibleInputs, '1996-07', TODAY);
    expect(result.englishOk).toBe(false);
    for (const s of result.jobs[0].streams) {
      expect(s.gates.find((g) => g.key === 'english')?.ok).toBe(false);
    }
  });

  it('returns a null age and unmet age gates when neither birth nor age bracket is entered', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const shared = { ...defaultSharedCriteria, english: 'ielts6' }; // age bracket also unset
    const trtInputs: SponsorshipInputs = { ...eligibleInputs, trtEligible: true };
    const result = evaluateSponsorship([j], shared, trtInputs, '', TODAY);
    expect(result.ageYears).toBeNull();
    expect(result.ageUnder45).toBeNull();
    const trt = result.jobs[0].streams.find((s) => s.code === '186trt')!;
    expect(trt.eligible).toBe(false);
  });
});

describe('label maps', () => {
  it('has a STREAM_LABEL_KEY entry for every declared stream', () => {
    for (const s of sponsorshipStreams) {
      expect(STREAM_LABEL_KEY[s.code]).toBeTruthy();
    }
  });

  it('has a GATE_LABEL_KEY entry for every gate key evaluateSponsorship can produce', () => {
    const j = job({ anzsco: '261313', ausWork: '8-10' });
    const shared = { ...defaultSharedCriteria, english: 'ielts6' };
    const inputs: SponsorshipInputs = { hasSponsor: true, salaryBand: 'ssitPlus', trtEligible: true };
    const result = evaluateSponsorship([j], shared, inputs, '1996-07', TODAY);
    for (const stream of result.jobs[0].streams) {
      for (const gate of stream.gates) {
        expect(GATE_LABEL_KEY[gate.key]).toBeTruthy();
      }
    }
  });
});

describe('defaultSponsorshipInputs', () => {
  it('starts with no sponsor, no salary band and no TRT eligibility', () => {
    expect(defaultSponsorshipInputs).toEqual({ hasSponsor: false, salaryBand: '', trtEligible: false });
  });
});
