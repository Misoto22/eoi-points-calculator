import type { PointsBreakdown } from './types';

interface ExportData {
  breakdown: PointsBreakdown;
  labels: Record<string, string>;
  title: string;
  date: string;
  goalPoints: number;
  visaStatus: { code: string; name: string; eligible: boolean }[];
}

// 颜色定义
const COLORS = {
  teal: [13, 148, 136] as const,
  tealLight: [240, 253, 250] as const,
  dark: [26, 26, 26] as const,
  secondary: [107, 101, 96] as const,
  tertiary: [155, 149, 143] as const,
  border: [232, 229, 225] as const,
  pageBg: [250, 249, 247] as const,
  white: [255, 255, 255] as const,
  danger: [185, 28, 28] as const,
};

export async function exportPdf(data: ExportData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageW = 210;
  const margin = 24;
  const contentW = pageW - margin * 2;
  let y = 0;

  // --- 顶部色带 ---
  doc.setFillColor(...COLORS.teal);
  doc.rect(0, 0, pageW, 3, 'F');

  y = 28;

  // --- 标题 ---
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.dark);
  doc.text(data.title, margin, y);
  y += 7;

  // 日期
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.tertiary);
  doc.text(data.date, margin, y);
  y += 14;

  // --- 总分卡片 ---
  const cardH = 28;
  doc.setFillColor(...COLORS.tealLight);
  doc.roundedRect(margin, y, contentW, cardH, 3, 3, 'F');

  // 总分标签
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(data.labels.total || 'Total Points', margin + 8, y + 11);

  // 总分数字
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.teal);
  doc.text(`${data.breakdown.total}`, margin + contentW - 8, y + 18, { align: 'right' });

  // 目标分数
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.tertiary);
  const goalText = `Goal: ${data.goalPoints}`;
  doc.text(goalText, margin + 8, y + 20);

  // 进度条
  const barX = margin + 8;
  const barY = y + 23;
  const barW = contentW - 16;
  const barH = 2;
  const progress = Math.min((data.breakdown.total / data.goalPoints) * 100, 100);

  doc.setFillColor(...COLORS.border);
  doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');
  if (progress > 0) {
    doc.setFillColor(...COLORS.teal);
    doc.roundedRect(barX, barY, barW * (progress / 100), barH, 1, 1, 'F');
  }

  y += cardH + 12;

  // --- 签证资格 ---
  if (data.visaStatus.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.tertiary);
    doc.text('VISA ELIGIBILITY', margin, y);
    y += 6;

    let badgeX = margin;
    for (const visa of data.visaStatus) {
      const label = `${visa.code} ${visa.name}`;
      const badgeW = doc.getTextWidth(label) + 10;

      if (visa.eligible) {
        doc.setFillColor(...COLORS.tealLight);
        doc.setDrawColor(...COLORS.teal);
      } else {
        doc.setFillColor(...COLORS.white);
        doc.setDrawColor(...COLORS.border);
      }
      doc.roundedRect(badgeX, y - 3.5, badgeW, 7, 1.5, 1.5, 'FD');

      doc.setFontSize(8);
      const tc = visa.eligible ? COLORS.teal : COLORS.tertiary;
      doc.setTextColor(tc[0], tc[1], tc[2]);
      doc.text(label, badgeX + 5, y + 0.5);

      badgeX += badgeW + 3;
    }
    y += 12;
  }

  // --- 分割线 ---
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, y, margin + contentW, y);
  y += 10;

  // --- 明细标题 ---
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.tertiary);
  doc.text('POINTS BREAKDOWN', margin, y);
  y += 8;

  // --- 明细表格 ---
  const categories = [
    'age', 'english', 'ausWork', 'overseasWork', 'education',
    'stem', 'ausStudy', 'communityLanguage', 'professionalYear',
    'stateNomination', 'regionalNomination', 'regionalStudy', 'partnerStatus',
  ] as const;

  const activeCategories = categories.filter(k => data.breakdown[k] > 0);

  // 表头
  doc.setFillColor(...COLORS.pageBg);
  doc.rect(margin, y - 3, contentW, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.tertiary);
  doc.text('Category', margin + 4, y + 1);
  doc.text('Points', margin + contentW - 4, y + 1, { align: 'right' });
  y += 8;

  // 行
  for (let i = 0; i < activeCategories.length; i++) {
    const key = activeCategories[i];
    const pts = data.breakdown[key];

    // 斑马纹
    if (i % 2 === 0) {
      doc.setFillColor(252, 251, 250);
      doc.rect(margin, y - 4, contentW, 8, 'F');
    }

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text(data.labels[key] || key, margin + 4, y);

    // 分数徽章
    const ptsText = `+${pts}`;
    const ptsW = doc.getTextWidth(ptsText) + 6;
    doc.setFillColor(...COLORS.tealLight);
    doc.roundedRect(margin + contentW - ptsW - 2, y - 3.5, ptsW, 6, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.teal);
    doc.text(ptsText, margin + contentW - 4, y, { align: 'right' });

    y += 9;
  }

  // --- 总计行 ---
  y += 2;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, y, margin + contentW, y);
  y += 8;

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text(data.labels.total || 'Total', margin + 4, y);

  const totalText = `${data.breakdown.total}`;
  const totalW = doc.getTextWidth(totalText) + 8;
  doc.setFillColor(...COLORS.teal);
  doc.roundedRect(margin + contentW - totalW - 2, y - 4.5, totalW, 8, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.text(totalText, margin + contentW - 4, y, { align: 'right' });

  // --- 底部 ---
  y = 280;
  doc.setDrawColor(...COLORS.border);
  doc.line(margin, y, margin + contentW, y);
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.tertiary);
  doc.text('Generated by EOI Points Calculator — eoi-points-calculator.vercel.app', margin, y);

  doc.save('eoi-points.pdf');
}
