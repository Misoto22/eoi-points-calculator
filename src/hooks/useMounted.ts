'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * True only once the client has hydrated — the standard escape hatch for
 * deferring client-only rendering (avoids a server/client markup mismatch)
 * without an effect-driven setState: the server snapshot is always `false`,
 * the client snapshot is always `true`, so React's hydration pass alone
 * drives the flip.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
