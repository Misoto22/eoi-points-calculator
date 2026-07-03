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
        <span aria-hidden="true" className="text-[0.8125rem]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--muted)' }}>
          {num}
        </span>
        <h2 className="m-0 text-[0.78125rem] font-medium tracking-[0.2em]">{title}</h2>
      </div>
      <span className="text-[0.65625rem] tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
        {side}
      </span>
    </div>
  );
}
