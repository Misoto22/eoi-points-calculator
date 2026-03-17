import type { PointsBreakdown } from './types';

interface ExportData {
  breakdown: PointsBreakdown;
  labels: Record<string, string>;
  title: string;
  date: string;
}

export async function exportPdf(data: ExportData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 20;
  let y = margin;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(26, 26, 26);
  doc.text(data.title, margin, y);
  y += 8;

  // Date
  doc.setFontSize(10);
  doc.setTextColor(155, 149, 143);
  doc.text(data.date, margin, y);
  y += 12;

  // Divider
  doc.setDrawColor(232, 229, 225);
  doc.line(margin, y, 190, y);
  y += 8;

  // Breakdown
  const categories = [
    'age', 'english', 'ausWork', 'overseasWork', 'education',
    'stem', 'ausStudy', 'communityLanguage', 'professionalYear',
    'stateNomination', 'regionalNomination', 'regionalStudy', 'partnerStatus',
  ] as const;

  doc.setFontSize(11);
  for (const key of categories) {
    const pts = data.breakdown[key];
    if (pts === 0) continue;

    doc.setTextColor(107, 101, 96);
    doc.text(data.labels[key] || key, margin, y);
    doc.setTextColor(13, 148, 136);
    doc.text(`+${pts}`, 170, y, { align: 'right' });
    y += 7;
  }

  // Total divider
  y += 4;
  doc.line(margin, y, 190, y);
  y += 8;

  // Total
  doc.setFontSize(16);
  doc.setTextColor(26, 26, 26);
  doc.text(data.labels.total || 'Total', margin, y);
  doc.setTextColor(13, 148, 136);
  doc.text(`${data.breakdown.total}`, 170, y, { align: 'right' });

  doc.save('eoi-points.pdf');
}
