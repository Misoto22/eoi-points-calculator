import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { languages } from './i18n/settings';
import { ThemeProvider } from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

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
      { url: '/favicon.ico' },                         // Default
      { url: '/favicon-32x32.png', sizes: '32x32' },   // Browser icon
      { url: '/favicon-16x16.png', sizes: '16x16' },   // Small browser icon
      { url: '/apple-touch-icon.png', rel: 'apple-touch-icon', sizes: '180x180' }, // iOS
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
  params: { lng },
}: {
  children: React.ReactNode;
  params: { lng: string };
}) {
  return (
    <html lang={lng} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = storedTheme || 'system';
                document.documentElement.classList.add(theme === 'system' ? systemTheme : theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}>
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
