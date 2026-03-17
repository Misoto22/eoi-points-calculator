// SkillSelect 邀请轮次数据 — 来源: immi.homeaffairs.gov.au
// 最后更新: 2026-03
// 注意: 2024-25 起改为按职业层级分配，最低分因职业而异
// 此处显示的是整体最低邀请分数，实际热门职业（ICT/会计）可能需要 90+ 分
export interface InvitationRound {
  date: string;
  visa: '189';
  minimumPoints: number;
  invitations: number;
}

export const invitationRounds: InvitationRound[] = [
  { date: '2025-11', visa: '189', minimumPoints: 65, invitations: 10000 },
  { date: '2025-08', visa: '189', minimumPoints: 65, invitations: 6887 },
  { date: '2024-09', visa: '189', minimumPoints: 65, invitations: 7973 },
  { date: '2024-06', visa: '189', minimumPoints: 65, invitations: 5292 },
  { date: '2024-03', visa: '189', minimumPoints: 65, invitations: 5000 },
  { date: '2023-12', visa: '189', minimumPoints: 65, invitations: 5000 },
];
