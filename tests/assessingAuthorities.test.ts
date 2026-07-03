// tests/assessingAuthorities.test.ts
import { describe, expect, it } from 'vitest';
import { assessingAuthority } from '@/data/assessingAuthorities';
import { occupations } from '@/data/occupations';

describe('assessingAuthority', () => {
  it('maps ICT occupations to ACS with 2-year validity', () => {
    expect(assessingAuthority('261313')).toEqual({ authority: 'ACS', validityYears: 2 });
    expect(assessingAuthority('135112')).toEqual({ authority: 'ACS', validityYears: 2 });
    // 313113 Web Administrator is unit group 3131 (ICT Support Technicians) → ACS
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

  // ── Corrections from 2026-07-03 audit ──────────────────────────────────

  it('maps 2633xx Telecommunications Engineers to Engineers Australia, not ACS', () => {
    // 263311 and 263312 are engineering-degree occupations assessed by EA via CDR
    expect(assessingAuthority('263311')).toEqual({ authority: 'Engineers Australia', validityYears: 3 });
    expect(assessingAuthority('263312')).toEqual({ authority: 'Engineers Australia', validityYears: 3 });
    // 2631xx (Computer Network Engineers) still ACS
    expect(assessingAuthority('263111').authority).toBe('ACS');
  });

  it('maps 313211 Radiocommunications Technician to TRA', () => {
    expect(assessingAuthority('313211')).toEqual({ authority: 'TRA', validityYears: 3 });
  });

  it('maps 3132xx Telecommunications Technical Specialists (except 313211) to Engineers Australia', () => {
    expect(assessingAuthority('313212')).toEqual({ authority: 'Engineers Australia', validityYears: 3 });
    expect(assessingAuthority('313213')).toEqual({ authority: 'Engineers Australia', validityYears: 3 });
    expect(assessingAuthority('313214')).toEqual({ authority: 'Engineers Australia', validityYears: 3 });
  });

  it('maps 271214 Intellectual Property Lawyer and 271299 to VETASSESS, not SLAA', () => {
    expect(assessingAuthority('271214')).toEqual({ authority: 'VETASSESS', validityYears: 3 });
    expect(assessingAuthority('271299')).toEqual({ authority: 'VETASSESS', validityYears: 3 });
    // Barristers and Solicitors still go to SLAA
    expect(assessingAuthority('271111').authority).toMatch(/SLAA/);
    expect(assessingAuthority('271311').authority).toMatch(/SLAA/);
  });

  it('maps 272613 Welfare Worker to ACWA', () => {
    expect(assessingAuthority('272613')).toEqual({ authority: 'ACWA', validityYears: 3 });
    // 272611 Community Arts Worker and 272612 Recreation Officer fall through to VETASSESS
    expect(assessingAuthority('272611').authority).toBe('VETASSESS');
    expect(assessingAuthority('272612').authority).toBe('VETASSESS');
  });

  it('maps 2523xx Dental Professionals to ADC', () => {
    expect(assessingAuthority('252311')).toEqual({ authority: 'ADC', validityYears: 3 });
    expect(assessingAuthority('252312')).toEqual({ authority: 'ADC', validityYears: 3 });
    // Physiotherapists (2525) still AHPRA/VETASSESS
    expect(assessingAuthority('252511').authority).toMatch(/AHPRA/);
  });

  it('maps pilots to CASA but Flying Instructor to VETASSESS', () => {
    expect(assessingAuthority('231111')).toEqual({ authority: 'CASA', validityYears: 3 });
    expect(assessingAuthority('231114')).toEqual({ authority: 'CASA', validityYears: 3 });
    // 231113 Flying Instructor is the exception — VETASSESS, not CASA
    expect(assessingAuthority('231113')).toEqual({ authority: 'VETASSESS', validityYears: 3 });
  });

  it('splits 3131 ICT support technicians between TRA and ACS', () => {
    expect(assessingAuthority('313111')).toEqual({ authority: 'TRA', validityYears: 3 });
    expect(assessingAuthority('313112')).toEqual({ authority: 'TRA', validityYears: 3 });
    expect(assessingAuthority('313199')).toEqual({ authority: 'TRA', validityYears: 3 });
    expect(assessingAuthority('313113')).toEqual({ authority: 'ACS', validityYears: 2 });
  });

  it('maps the whole 2712 judicial unit group to VETASSESS', () => {
    expect(assessingAuthority('271214')).toEqual({ authority: 'VETASSESS', validityYears: 3 });
    expect(assessingAuthority('271299')).toEqual({ authority: 'VETASSESS', validityYears: 3 });
    // Barristers and Solicitors stay with the state legal admission authorities
    expect(assessingAuthority('271111').authority).toMatch(/SLAA/);
    expect(assessingAuthority('271311').authority).toMatch(/SLAA/);
  });

  it('maps 251411 Optometrist to OCANZ', () => {
    expect(assessingAuthority('251411')).toEqual({ authority: 'OCANZ', validityYears: 3 });
    // Orthoptist stays on the generic 251 rule
    expect(assessingAuthority('251412').authority).toMatch(/AHPRA/);
  });

  it('maps 2312xx marine transport professionals to AMSA', () => {
    expect(assessingAuthority('231213')).toEqual({ authority: 'AMSA', validityYears: 3 });
  });

  it('maps 411213 Dental Technician to TRA', () => {
    expect(assessingAuthority('411213')).toEqual({ authority: 'TRA', validityYears: 3 });
    // Dental Hygienist and Therapist remain on VETASSESS default
    expect(assessingAuthority('411211').authority).toBe('VETASSESS');
    expect(assessingAuthority('411214').authority).toBe('VETASSESS');
  });

  it('maps 4117xx Community Workers to CWA', () => {
    expect(assessingAuthority('411711')).toEqual({ authority: 'CWA', validityYears: 3 });
    expect(assessingAuthority('411712')).toEqual({ authority: 'CWA', validityYears: 3 });
    expect(assessingAuthority('411713')).toEqual({ authority: 'CWA', validityYears: 3 });
    expect(assessingAuthority('411715')).toEqual({ authority: 'CWA', validityYears: 3 });
    expect(assessingAuthority('411716')).toEqual({ authority: 'CWA', validityYears: 3 });
  });

  it('resolves every occupation in the dataset', () => {
    for (const o of occupations) {
      const info = assessingAuthority(o.anzsco);
      expect(info.authority.length, o.anzsco).toBeGreaterThan(0);
      expect(info.validityYears === null || info.validityYears >= 1, o.anzsco).toBe(true);
    }
  });
});
