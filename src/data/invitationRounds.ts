// SkillSelect 邀请轮次数据 — 来源: immi.homeaffairs.gov.au
// 最后更新: 2026-03
// 注意：数据可能不完全准确，请以官方 SkillSelect 网站为准
export interface InvitationRound {
  date: string;
  visa: '189' | '190' | '491';
  minimumPoints: number;
  invitations: number;
}

export const invitationRounds: InvitationRound[] = [
  { date: '2026-02', visa: '189', minimumPoints: 65, invitations: 1000 },
  { date: '2026-01', visa: '189', minimumPoints: 65, invitations: 1000 },
  { date: '2025-12', visa: '189', minimumPoints: 65, invitations: 1200 },
  { date: '2025-11', visa: '189', minimumPoints: 65, invitations: 1500 },
  { date: '2025-10', visa: '189', minimumPoints: 65, invitations: 1500 },
  { date: '2025-09', visa: '189', minimumPoints: 65, invitations: 1500 },
  { date: '2025-08', visa: '189', minimumPoints: 65, invitations: 1000 },
  { date: '2025-07', visa: '189', minimumPoints: 65, invitations: 1000 },
];
