// SkillSelect 邀请轮次数据 — 来源: immi.homeaffairs.gov.au
// 最后更新: 2025-03
export interface InvitationRound {
  date: string;
  visa: '189' | '190' | '491';
  minimumPoints: number;
  invitations: number;
}

export const invitationRounds: InvitationRound[] = [
  { date: '2025-02', visa: '189', minimumPoints: 65, invitations: 1000 },
  { date: '2025-01', visa: '189', minimumPoints: 65, invitations: 1000 },
  { date: '2024-12', visa: '189', minimumPoints: 65, invitations: 1250 },
  { date: '2024-11', visa: '189', minimumPoints: 65, invitations: 1500 },
  { date: '2024-10', visa: '189', minimumPoints: 65, invitations: 1500 },
  { date: '2024-09', visa: '189', minimumPoints: 65, invitations: 1500 },
  { date: '2024-08', visa: '189', minimumPoints: 65, invitations: 1000 },
  { date: '2024-07', visa: '189', minimumPoints: 65, invitations: 1000 },
];
