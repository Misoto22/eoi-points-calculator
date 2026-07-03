// SkillSelect subclass-189 invitation rounds — source: immi.homeaffairs.gov.au SkillSelect
// Last audited: 2026-07 (corroborated across reputable migration sources; the official DHA
//   SkillSelect page returns HTTP 403 to automated fetches).
// NOTE: `minimumPoints` (65) is the per-occupation FLOOR — the lowest score invited for
//   high-demand trades that round. It is NOT a general pass mark: since 2024-25, 189 runs a
//   few large, roughly quarterly rounds ranked by occupation, and professional / STEM / medical
//   occupations typically needed 85-115 points in the same round.
// The 2026-06 round (4 Jun 2026) is confirmed on the official SkillSelect page:
//   10,000 invitations. Its 65-pt trades floor comes from corroborated community
//   trackers (RACC, Magpie Consultants) — DHA does not publish per-round floors.
export interface InvitationRound {
  date: string;
  visa: '189';
  minimumPoints: number;
  invitations: number;
}

export const invitationRounds: InvitationRound[] = [
  { date: '2026-06', visa: '189', minimumPoints: 65, invitations: 10000 },
  { date: '2025-11', visa: '189', minimumPoints: 65, invitations: 10000 },
  { date: '2025-08', visa: '189', minimumPoints: 65, invitations: 6887 },
  { date: '2024-11', visa: '189', minimumPoints: 65, invitations: 15000 },
  { date: '2024-09', visa: '189', minimumPoints: 65, invitations: 7973 },
  { date: '2024-06', visa: '189', minimumPoints: 65, invitations: 5292 },
  { date: '2023-12', visa: '189', minimumPoints: 65, invitations: 8300 },
];
