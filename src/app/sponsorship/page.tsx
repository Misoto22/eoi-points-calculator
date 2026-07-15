import type { Metadata } from 'next';
import SponsorshipClient from './SponsorshipClient';

export const metadata: Metadata = {
  title: 'Employer Sponsorship Checklist (482/186) — EOI Points Calculator',
  description: 'Check your nominated occupations against the subclass 482 (Skills in Demand) and 186 (Employer Nomination Scheme) sponsorship pathways — Core Skills Occupation List, salary thresholds, work experience, age and English.',
  openGraph: {
    title: 'Employer Sponsorship Checklist (482/186)',
    description: 'A separate, non-points-tested pathway for subclass 482 and 186 — check your occupations against the CSOL, salary thresholds, experience, age and English.',
  },
};

export default function Page() {
  return <SponsorshipClient />;
}
