import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { languages } from './i18n/settings';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export const metadata = {
  title: 'EOI Points Calculator',
  description: 'The EOI Points Calculator is a tool designed to help potential immigrants to Australia calculate their points based on their personal and professional background.',
}

export default function RootLayout({
  children,
  params: { lng },
}: {
  children: React.ReactNode;
  params: { lng: string };
}) {
  return (
    <html lang={lng}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
