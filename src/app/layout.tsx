import React from 'react';
import '../styles/globals.css';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { ThemeProvider } from '../components/ThemeProvider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
});

export const viewport = {
  themeColor: '#ffffff',
};

export const metadata = {
  title: 'EOI Points Calculator',
  description: 'The EOI Points Calculator is a tool designed to help potential immigrants to Australia calculate their points based on their personal and professional background.',
  metadataBase: new URL('https://eoi-points-calculator.vercel.app'),
  openGraph: {
    title: 'EOI Points Calculator',
    description: 'Calculate your EOI points for Australian immigration easily and accurately',
    siteName: 'EOI Points Calculator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'EOI Points Calculator Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EOI Points Calculator',
    description: 'Calculate your EOI points for Australian immigration easily and accurately',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16' },
      { url: '/apple-touch-icon.png', rel: 'apple-touch-icon', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = storedTheme || 'system';
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme === 'system' ? systemTheme : theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="transition-colors duration-200">
        <ThemeProvider
          defaultTheme="system"
          enableSystem
          attribute="class"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
