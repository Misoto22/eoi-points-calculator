'use client';

import { useEffect, useRef, useState } from 'react';

/** Animate a number towards `target` with an ease-out cubic curve */
export function useAnimatedNumber(target: number, duration = 650): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const displayRef = useRef(display);

  // Mirrors `display` into a ref so the animation effect below can read the
  // latest value without depending on it (that would restart the animation
  // on every intermediate frame). Runs as its own effect, in declaration
  // order before the animation effect, rather than a write during render.
  useEffect(() => {
    displayRef.current = display;
  }, [display]);

  useEffect(() => {
    const from = displayRef.current;
    if (from === target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Reduced-motion escape hatch: jump straight to `target` instead of
      // animating. `window.matchMedia` isn't render-safe (differs
      // server/client), so this check has to stay in the effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (target - from) * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
