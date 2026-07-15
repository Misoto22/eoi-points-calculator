'use client';

import { useEffect, useRef, useState } from 'react';

interface HScrollFadeProps {
  children: React.ReactNode;
}

/**
 * Horizontal-scroll wrapper for content that can be wider than its
 * container (the timeline chart, the comparison table) on narrow
 * viewports. Shows a right-edge fade while there's more to scroll to,
 * since a bare `overflow-x-auto` gives no hint the content continues.
 */
export default function HScrollFade({ children }: HScrollFadeProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
      setHasOverflow(remaining > 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto">
        {children}
      </div>
      {hasOverflow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-10"
          style={{ background: 'linear-gradient(to right, transparent, var(--bg) 85%)' }}
        />
      )}
    </div>
  );
}
