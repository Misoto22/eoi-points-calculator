// src/data/assessingAuthorities.ts
// Maps ANZSCO occupation codes to their skills-assessing authority and the
// validity period of that assessment for Australian skilled-migration (GSM).
//
// Verified 2026-07-03 against official sources:
// 1. ACS validity = 2 years from date of issue.
//    Source: https://www.acs.org.au/msa/infohub/assessment-process.html
//    "Suitable outcomes are valid for 2 years."
// 2. Migration-regulation default = 3 years from date of issue (unless the
//    authority specifies a shorter period — ACS specifies 2 years).
//    Source: immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment
//    "valid until the expiry date on the assessment, or 3 years from issue,
//    whichever occurs first."
// 3. NAATI CCL credentials DO expire (brief expected null / does-not-expire).
//    Credentials issued from 9 Aug 2022 → 5-year validity; before that → 3 years.
//    Source: https://www.naati.com.au/news/update-to-ccl-validity/
//    NOTE: CCL is not a skills-assessment authority; it grants 5 bonus points.
//    The timeline engine should treat the CCL credential as 5-year validity,
//    not as never-expiring. NAATI professional interpreter/translator assessments
//    follow the standard 3-year regulation default.
// 4. English-test validity for points: test taken within the 3 years immediately
//    before the invitation is issued.
//    Source: immi.homeaffairs.gov.au (Schedule 6D, English language criteria)
//
// Assessing-authority assignments follow the DHA list at:
//   https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment/assessing-authorities

export interface AuthorityInfo {
  authority: string;
  /** Years the assessment stays valid; null = does not expire */
  validityYears: number | null;
}

// Longest-prefix match wins.  Keep prefixes sorted roughly by specificity;
// the lookup sorts by length so order here is for readability only.
const PREFIX_RULES: Record<string, AuthorityInfo> = {
  // ── ICT ── ACS, 2-year validity ─────────────────────────────────────────
  // Source: https://www.acs.org.au/msa/assessment-pathway.html
  '1351': { authority: 'ACS', validityYears: 2 },   // ICT Managers (135112, 135199)
  '261':  { authority: 'ACS', validityYears: 2 },   // ICT Business/Systems Analysts
  '262':  { authority: 'ACS', validityYears: 2 },   // ICT Database/Systems Administrators
  '263':  { authority: 'ACS', validityYears: 2 },   // ICT Network/Security Professionals (excl. 2633)
  '313':  { authority: 'ACS', validityYears: 2 },   // ICT Support Technicians (3131 only; 3132 overridden below)

  // ── Telecommunications Engineering Professionals ── Engineers Australia ──
  // ANZSCO unit group 2633 (263311 Telecommunications Engineer,
  // 263312 Telecommunications Network Engineer) are engineering-degree
  // occupations assessed by Engineers Australia via CDR, NOT by ACS.
  // Source: https://www.anzscosearch.com/263311/
  //         https://www.anzscosearch.com/263312/
  '2633': { authority: 'Engineers Australia', validityYears: 3 },

  // ── Telecommunications Technical Specialists ── EA / TRA split ───────────
  // Unit group 3132 is NOT under ACS.  Within 3132:
  //   313211 Radiocommunications Technician → TRA (Skill Level 2 trade)
  //   313212 Telecommunications Field Engineer  ┐
  //   313213 Telecommunications Network Planner ├→ Engineers Australia
  //   313214 Telecommunications Technical Officer / Technologist ┘
  // Source: https://www.anzscosearch.com/313211/ (TRA)
  //         https://www.anzscosearch.com/313212/ (EA)
  //         https://www.anzscosearch.com/313213/ (EA)
  //         https://www.anzscosearch.com/313214/ (EA)
  '313211': { authority: 'TRA', validityYears: 3 },
  '3132':   { authority: 'Engineers Australia', validityYears: 3 },

  // ── Accountants & Auditors ── CPA Australia / CA ANZ / IPA, 3 years ────
  // Source: https://www.cpaaaustralia.com.au/members/skills-assessment
  '2211': { authority: 'CPAA / CAANZ / IPA', validityYears: 3 }, // Accountants (General, Mgt, Tax)
  '2212': { authority: 'CPAA / CAANZ / IPA', validityYears: 3 }, // Auditors, Company Secretaries

  // ── Engineering ── Engineers Australia, 3 years ─────────────────────────
  // Source: https://www.engineersaustralia.org.au/migrants/migration-skills-assessment
  '233':  { authority: 'Engineers Australia', validityYears: 3 }, // Engineering Professionals

  // ── Architects ── AACA, 3 years ─────────────────────────────────────────
  // Source: https://www.aaca.org.au/assessment/migration-skills-assessment/
  '232111': { authority: 'AACA', validityYears: 3 }, // Architect (232111 only; others → VETASSESS)

  // ── Air Transport Professionals ── CASA, 3 years ─────────────────────────
  // Aeroplane Pilots (231111), Flying Instructors (231113), and Helicopter
  // Pilots (231114) are assessed by the Civil Aviation Safety Authority (CASA),
  // not by VETASSESS.
  // Source: https://www.anzscosearch.com/231111/ (CASA)
  '2311': { authority: 'CASA', validityYears: 3 },

  // ── Marine Transport Professionals ── AMSA, 3 years ─────────────────────
  // Ship's Masters (231213) and other marine transport professionals (unit
  // group 2312) are assessed by the Australian Maritime Safety Authority
  // (AMSA), not by VETASSESS.
  // Source: https://www.amsa.gov.au/qualifications-training/international-qualifications/immigration-skills-assessment-mariners
  '2312': { authority: 'AMSA', validityYears: 3 },

  // ── School Teachers ── AITSL, 3 years ───────────────────────────────────
  // Source: https://www.aitsl.edu.au/teach/understand-the-teaching-profession/teacher-assessment-referral
  '241':  { authority: 'AITSL', validityYears: 3 }, // School Teachers

  // ── Nursing and Midwifery ── ANMAC, 3 years ─────────────────────────────
  // Source: https://anmac.org.au/assessment/skills-assessment
  '254':  { authority: 'ANMAC', validityYears: 3 }, // All nursing/midwifery (2541–2546)
  '4114': { authority: 'ANMAC', validityYears: 3 }, // Enrolled Nurses (411411)

  // ── Allied Health ── AHPRA-covered or VETASSESS, 3 years ────────────────
  // Source: https://www.ahpra.gov.au/
  '251':  { authority: 'AHPRA / VETASSESS', validityYears: 3 }, // Health Diagnostic & Promotion
  '252':  { authority: 'AHPRA / VETASSESS', validityYears: 3 }, // Allied Health Therapists (excl. 2523)

  // ── Dental Professionals ── ADC (Australian Dental Council), 3 years ─────
  // Dentists (252312) and Dental Specialists (252311) are assessed by the
  // Australian Dental Council (ADC), not AHPRA or VETASSESS.
  // Source: https://www.adc.org.au/assessments/dentists/skills-assessment/
  '2523': { authority: 'ADC', validityYears: 3 },

  // ── Medical Practitioners ── Medical Board of Australia (AHPRA), 3 years ─
  // Source: https://www.medicalboard.gov.au/
  '253':  { authority: 'Medical Board (AHPRA)', validityYears: 3 },

  // ── Legal ── State/territory legal admission authorities, 3 years ────────
  // Source: immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment/assessing-authorities
  '271':  { authority: 'SLAA (state legal bodies)', validityYears: 3 }, // Barristers, Solicitors

  // ── IP Lawyers / Judicial Professionals nec ── VETASSESS (not SLAA) ──────
  // 271214 Intellectual Property Lawyer and 271299 Judicial and Other Legal
  // Professionals nec are assessed by VETASSESS, not by state legal admission
  // authorities.  Barristers (271111) and Solicitors (271311) still use SLAA.
  // Source: https://www.vetassess.com.au/check-my-occupation/professional-occupations/intellectual-property-lawyer
  //         https://www.vetassess.com.au/check-my-occupation/professional-occupations/judicial-and-other-legal-professionals-nec
  '271214': { authority: 'VETASSESS', validityYears: 3 },
  '271299': { authority: 'VETASSESS', validityYears: 3 },

  // ── Psychologists ── APS, 3 years ───────────────────────────────────────
  // Source: https://www.psychology.org.au/for-members/migration-skills-assessment
  '2723': { authority: 'APS', validityYears: 3 },

  // ── Social Workers ── AASW, 3 years ─────────────────────────────────────
  // Source: https://www.aasw.asn.au/education-employment/migration-eligibility-assessment/
  // ("On behalf of the Australian Government, as a nominated assessing
  //  authority, the AASW assesses academic social work qualifications";
  //  positive assessment valid 3 years from issue.)
  '2725': { authority: 'AASW', validityYears: 3 }, // Social Workers (272511)

  // ── Welfare Worker ── ACWA (not VETASSESS) ───────────────────────────────
  // 272613 Welfare Worker is assessed by the Australian Community Workers
  // Association (ACWA).  The sibling occupations 272611 Community Arts Worker
  // and 272612 Recreation Officer are correctly covered by the VETASSESS
  // default (they are not listed under ACWA).
  // Source: https://www.acwa.org.au/migration-assessment/services
  //         https://www.anzscosearch.com/272613/
  '272613': { authority: 'ACWA', validityYears: 3 },

  // ── Science/Medical Technicians ── VETASSESS, 3 years ───────────────────
  // ANZSCO minor group 311 (Medical/Science Technicians) are assessed by
  // VETASSESS as professional occupations, not TRA; overrides the
  // major-group-3 TRA fallback below.
  // Source: https://www.vetassess.com.au/check-my-occupation/professional-occupations/medical-technicians-nec
  //   (Medical Technicians nec, ANZSCO 311299) and
  // https://www.vetassess.com.au/check-my-occupation/professional-occupations/life-science-technician
  //   (Life Science Technician, ANZSCO 311413)
  '311':  { authority: 'VETASSESS', validityYears: 3 },

  // ── Building/Engineering Technicians ── VETASSESS, 3 years ──────────────
  // ANZSCO minor group 312 are technical, not trade, workers; VETASSESS
  // is the correct authority, overriding the major-group-3 TRA fallback.
  // Source: https://www.vetassess.com.au/check-my-occupation/professional-occupations/civil-engineering-technician
  //   (Civil Engineering Technician, ANZSCO 312212, VETASSESS Group C)
  '312':  { authority: 'VETASSESS', validityYears: 3 },

  // ── Dental Technician ── TRA (not VETASSESS) ─────────────────────────────
  // 411213 Dental Technician is a Skill Level 3 trade occupation assessed by
  // Trades Recognition Australia (TRA), not VETASSESS.  Dental Hygienist
  // (411211) and Dental Therapist (411214) remain on VETASSESS default.
  // Source: https://www.anzscosearch.com/411213/
  '411213': { authority: 'TRA', validityYears: 3 },

  // ── Community Workers ── CWA (Community Work Australia), 3 years ─────────
  // Unit group 4117 (Community Worker 411711, Disabilities Services Officer
  // 411712, Family Support Worker 411713, Residential Care Officer 411715,
  // Youth Worker 411716) are assessed by Community Work Australia (CWA),
  // not VETASSESS.
  // Source: https://www.anzscosearch.com/411711/ (CWA)
  //         https://www.anzscosearch.com/411712/ (CWA)
  //         https://www.anzscosearch.com/411713/ (CWA)
  //         https://www.anzscosearch.com/411715/ (CWA)
  '4117': { authority: 'CWA', validityYears: 3 },
};

const PREFIXES = Object.keys(PREFIX_RULES).sort((a, b) => b.length - a.length);

export function assessingAuthority(anzsco: string): AuthorityInfo {
  const hit = PREFIXES.find((p) => anzsco.startsWith(p));
  if (hit) return PREFIX_RULES[hit];
  // Trades (ANZSCO major group 3) default to TRA; all other professionals
  // and managers not matched above default to VETASSESS.
  // Source: https://www.tradesrecognitionaustralia.gov.au/
  return anzsco.startsWith('3')
    ? { authority: 'TRA', validityYears: 3 }
    : { authority: 'VETASSESS', validityYears: 3 };
}
