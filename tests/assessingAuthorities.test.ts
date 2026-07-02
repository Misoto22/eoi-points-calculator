// tests/assessingAuthorities.test.ts
import { describe, expect, it } from 'vitest';
import { assessingAuthority } from '@/data/assessingAuthorities';
import { occupations } from '@/data/occupations';

describe('assessingAuthority', () => {
  it('maps ICT occupations to ACS with 2-year validity', () => {
    expect(assessingAuthority('261313')).toEqual({ authority: 'ACS', validityYears: 2 });
    expect(assessingAuthority('135112')).toEqual({ authority: 'ACS', validityYears: 2 });
    expect(assessingAuthority('313113')).toEqual({ authority: 'ACS', validityYears: 2 });
  });

  it('maps engineers to Engineers Australia', () => {
    expect(assessingAuthority('233211').authority).toBe('Engineers Australia');
    expect(assessingAuthority('233211').validityYears).toBe(3);
  });

  it('maps accountants, teachers and nurses to their bodies', () => {
    expect(assessingAuthority('221111').authority).toMatch(/CPA/);
    expect(assessingAuthority('241111').authority).toBe('AITSL');
    expect(assessingAuthority('254411').authority).toBe('ANMAC');
  });

  it('falls back to TRA for trades (major group 3) and VETASSESS otherwise', () => {
    expect(assessingAuthority('331111').authority).toBe('TRA');
    expect(assessingAuthority('224111').authority).toBe('VETASSESS');
  });

  it('resolves every occupation in the dataset', () => {
    for (const o of occupations) {
      const info = assessingAuthority(o.anzsco);
      expect(info.authority.length, o.anzsco).toBeGreaterThan(0);
      expect(info.validityYears === null || info.validityYears >= 1, o.anzsco).toBe(true);
    }
  });
});
