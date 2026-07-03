import type { MetadataRoute } from 'next';

// Served by Next at /manifest.webmanifest and linked automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EOI Points Calculator',
    short_name: 'EOI Points',
    description:
      'Calculate Expression of Interest points for Australian skilled migration (189 / 190 / 491) and project your score over time.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F2EFE6',
    theme_color: '#F2EFE6',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      // Safe-zone version for Android adaptive shapes (circle/squircle crops)
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
