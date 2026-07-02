'use client';

interface SectionHeadingProps {
  num: string;
  title: string;
  side: string;
}

export default function SectionHeading({ num, title, side }: SectionHeadingProps) {
  return (
    <div
      className="flex items-baseline justify-between pt-[13px]"
      style={{ borderTop: '1px solid var(--ink)' }}
    >
      <div className="flex items-baseline gap-3.5">
        <span className="text-[13px]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--muted)' }}>
          {num}
        </span>
        <span className="text-[12.5px] font-medium tracking-[0.2em]">{title}</span>
      </div>
      <span className="text-[10.5px] tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
        {side}
      </span>
    </div>
  );
}
