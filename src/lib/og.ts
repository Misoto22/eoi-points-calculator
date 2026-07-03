import { evaluate } from './points';
import type { AppState } from './urlState';

/** Query string for /api/og derived from parsed URL state (server-safe) */
export function buildOgQuery(state: AppState, lng: string | null): string {
  const ev = evaluate(state.shared, state.jobs);
  const q = new URLSearchParams();
  q.set('s', String(ev.bareScore));
  q.set('l', lng?.startsWith('zh') ? 'zh' : 'en');
  const occ = ev.jobs.map((je) => je.occupation?.en).filter(Boolean).slice(0, 3) as string[];
  if (occ.length) q.set('occ', occ.join('|'));
  const codes = [...new Set(ev.jobs.flatMap((je) => je.pathways.filter((p) => p.eligible).map((p) => p.code)))];
  if (codes.length) q.set('e', codes.join('|'));
  return q.toString();
}
