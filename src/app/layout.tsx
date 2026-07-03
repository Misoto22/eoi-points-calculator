import React from 'react';
import '../styles/globals.css';
import { Noto_Serif_SC } from 'next/font/google';
import { ThemeProvider } from '../components/ThemeProvider';

const notoSerifSC = Noto_Serif_SC({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
});

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2EFE6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E1C17' },
  ],
};

export const metadata = {
  title: 'EOI Points Calculator',
  description: 'Calculate Expression of Interest points for Australian skilled migration (189 / 190 / 491) and compare multiple skills assessments side by side.',
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
    <html lang="en" suppressHydrationWarning className={notoSerifSC.variable}>
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
              if ('serviceWorker' in navigator) {
                // Dev chunks are not content-hashed, so a cache-first SW serves
                // stale code — register in production only, clean up elsewhere.
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations()
                    .then((rs) => rs.forEach((r) => r.unregister()))
                    .catch(() => {});
                } else {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                }
              }
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'EOI Points Calculator',
              description: 'Calculate your Expression of Interest points for Australian skilled migration visas (189, 190, 491)',
              url: 'https://eoi-points-calculator.vercel.app',
              applicationCategory: 'UtilityApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'AUD',
              },
              inLanguage: ['en', 'zh-Hans'],
            }),
          }}
        />
      </head>
      <body>
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
