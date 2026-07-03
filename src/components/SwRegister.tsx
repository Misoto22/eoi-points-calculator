'use client';

import { useEffect } from 'react';

/**
 * Registers the hand-written service worker — production builds only.
 * Dev chunks are not content-hashed, so a cache-first SW would serve stale
 * code; in development any lingering registration is actively removed.
 */
export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    } else {
      navigator.serviceWorker
        .getRegistrations()
        .then((rs) => rs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
  }, []);
  return null;
}
