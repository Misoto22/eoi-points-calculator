import { describe, it, expect } from 'vitest';
import { calculateBreakdown } from '@/lib/points';
import { defaultFormData } from '@/lib/types';
import type { FormData } from '@/lib/types';

function makeForm(overrides: Partial<FormData> = {}): FormData {
  return { ...defaultFormData, ...overrides };
}

describe('calculateBreakdown', () => {
  // --- 空表单 ---
  it('returns 0 for empty form', () => {
    const result = calculateBreakdown(defaultFormData);
    expect(result.total).toBe(0);
    expect(result.age).toBe(0);
    expect(result.english).toBe(0);
  });

  // --- 年龄分数 ---
  describe('age points', () => {
    it.each([
      ['18-24', 25],
      ['25-32', 30],
      ['33-39', 25],
      ['40-44', 15],
    ])('age %s gives %d points', (age, expected) => {
      const result = calculateBreakdown(makeForm({ age }));
      expect(result.age).toBe(expected);
    });

    it('invalid age gives 0 points', () => {
      const result = calculateBreakdown(makeForm({ age: '45-49' }));
      expect(result.age).toBe(0);
    });
  });

  // --- 英语分数 ---
  describe('english points', () => {
    it('competent (ielts6) gives 0 points', () => {
      const result = calculateBreakdown(makeForm({ english: 'ielts6' }));
      expect(result.english).toBe(0);
    });

    it('proficient (ielts7) gives 10 points', () => {
      const result = calculateBreakdown(makeForm({ english: 'ielts7' }));
      expect(result.english).toBe(10);
    });

    it('superior (ielts8) gives 20 points', () => {
      const result = calculateBreakdown(makeForm({ english: 'ielts8' }));
      expect(result.english).toBe(20);
    });
  });

  // --- 澳洲工作经验 ---
  describe('Australian work experience', () => {
    it.each([
      ['1-3', 5],
      ['3-5', 10],
      ['5-8', 15],
      ['8-10', 20],
    ])('%s years gives %d points', (years, expected) => {
      const result = calculateBreakdown(makeForm({ ausWork: years }));
      expect(result.ausWork).toBe(expected);
    });
  });

  // --- 海外工作经验 ---
  describe('overseas work experience', () => {
    it.each([
      ['3-5', 5],
      ['5-8', 10],
      ['8-10', 15],
    ])('%s years gives %d points', (years, expected) => {
      const result = calculateBreakdown(makeForm({ overseasWork: years }));
      expect(result.overseasWork).toBe(expected);
    });

    it('1-3 years overseas gives 0 points', () => {
      const result = calculateBreakdown(makeForm({ overseasWork: '1-3' }));
      expect(result.overseasWork).toBe(0);
    });
  });

  // --- 教育分数 ---
  describe('education points', () => {
    it.each([
      ['apprenticeship', 10],
      ['cert3', 10],
      ['diploma', 10],
      ['bachelor', 15],
      ['phd', 20],
    ])('%s gives %d points', (edu, expected) => {
      const result = calculateBreakdown(makeForm({ education: edu }));
      expect(result.education).toBe(expected);
    });
  });

  // --- 伴侣分数 ---
  describe('partner status', () => {
    it.each([
      ['single', 10],
      ['partnerSkills', 10],
      ['partnerCitizen', 10],
      ['partnerEnglish', 5],
    ])('%s gives %d points', (status, expected) => {
      const result = calculateBreakdown(makeForm({ partnerStatus: status }));
      expect(result.partnerStatus).toBe(expected);
    });

    it('no partner status gives 0', () => {
      const result = calculateBreakdown(makeForm({ partnerStatus: '' }));
      expect(result.partnerStatus).toBe(0);
    });
  });

  // --- 奖励分数 ---
  describe('bonus points', () => {
    it('STEM gives 10', () => {
      expect(calculateBreakdown(makeForm({ stem: true })).stem).toBe(10);
    });

    it('Australian study gives 5', () => {
      expect(calculateBreakdown(makeForm({ ausStudy: true })).ausStudy).toBe(5);
    });

    it('community language gives 5', () => {
      expect(calculateBreakdown(makeForm({ communityLanguage: true })).communityLanguage).toBe(5);
    });

    it('professional year gives 5', () => {
      expect(calculateBreakdown(makeForm({ professionalYear: true })).professionalYear).toBe(5);
    });

    it('state nomination gives 5', () => {
      expect(calculateBreakdown(makeForm({ stateNomination: true })).stateNomination).toBe(5);
    });

    it('regional nomination gives 15', () => {
      expect(calculateBreakdown(makeForm({ regionalNomination: true })).regionalNomination).toBe(15);
    });

    it('regional study gives 5', () => {
      expect(calculateBreakdown(makeForm({ regionalStudy: true })).regionalStudy).toBe(5);
    });
  });

  // --- 总分计算 ---
  describe('total calculation', () => {
    it('sums all categories correctly', () => {
      const result = calculateBreakdown(makeForm({
        age: '25-32',        // 30
        english: 'ielts8',   // 20
        ausWork: '8-10',     // 20
        education: 'phd',    // 20
        partnerStatus: 'single', // 10
        stem: true,          // 10
        ausStudy: true,      // 5
      }));
      expect(result.total).toBe(30 + 20 + 20 + 20 + 10 + 10 + 5);
      expect(result.total).toBe(115);
    });

    it('maximum possible score', () => {
      const result = calculateBreakdown(makeForm({
        age: '25-32',              // 30
        english: 'ielts8',         // 20
        ausWork: '8-10',           // 20
        overseasWork: '8-10',      // 15
        education: 'phd',          // 20
        stem: true,                // 10
        ausStudy: true,            // 5
        communityLanguage: true,   // 5
        professionalYear: true,    // 5
        regionalNomination: true,  // 15
        regionalStudy: true,       // 5
        partnerStatus: 'single',   // 10
      }));
      expect(result.total).toBe(160);
    });

    it('minimum passing score scenario', () => {
      // 25-32岁(30) + bachelor(15) + proficient english(10) + single(10) = 65
      const result = calculateBreakdown(makeForm({
        age: '25-32',
        education: 'bachelor',
        english: 'ielts7',
        partnerStatus: 'single',
      }));
      expect(result.total).toBe(65);
    });
  });

  // --- 互斥测试（数据层面） ---
  describe('data integrity', () => {
    it('both nominations can be set (form handles mutual exclusion)', () => {
      // calculateBreakdown is a pure function — it doesn't enforce mutual exclusion
      // The form component handles that; the function just calculates
      const result = calculateBreakdown(makeForm({
        stateNomination: true,
        regionalNomination: true,
      }));
      expect(result.stateNomination).toBe(5);
      expect(result.regionalNomination).toBe(15);
      expect(result.total).toBe(20);
    });
  });
});
