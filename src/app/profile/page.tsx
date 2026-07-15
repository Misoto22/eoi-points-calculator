import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Your Profile — EOI Points Calculator',
  description: 'Enter the criteria shared across every migration pathway — age, English, education, partner status, bonuses and nominated occupations — once, then check them against the Independent Migration and Employer Sponsorship pages.',
};

export default function Page() {
  return <ProfileClient />;
}
