import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { parseStateFromParams } from '@/lib/urlState';
import { buildOgQuery } from '@/lib/og';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') params.set(k, v);
  }
  const state = parseStateFromParams(params);
  if (!state) return {};   // no shared state → inherit the static metadata from layout
  const img = `/api/og?${buildOgQuery(state, params.get('lng'))}`;
  const description = 'Calculate your EOI points for Australian immigration easily and accurately';
  return {
    openGraph: { title: 'EOI Points Calculator', description, images: [{ url: img, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: 'EOI Points Calculator', description, images: [img] },
  };
}

export default function Page() {
  return <HomeClient />;
}
