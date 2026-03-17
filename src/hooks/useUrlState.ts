'use client';

import { useEffect, useRef } from 'react';
import type { FormData } from '@/lib/types';
import { defaultFormData } from '@/lib/types';

const BOOL_FIELDS = [
  'stem', 'ausStudy', 'communityLanguage', 'professionalYear',
  'stateNomination', 'regionalNomination', 'regionalStudy',
] as const;

const STRING_FIELDS = [
  'age', 'english', 'ausWork', 'overseasWork', 'education', 'partnerStatus',
] as const;

export function readFormFromUrl(): FormData | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.size === 0) return null;

  const data = { ...defaultFormData };
  let hasAny = false;

  for (const key of STRING_FIELDS) {
    const v = params.get(key);
    if (v) { data[key] = v; hasAny = true; }
  }
  for (const key of BOOL_FIELDS) {
    const v = params.get(key);
    if (v !== null) { data[key] = v === '1'; hasAny = true; }
  }

  return hasAny ? data : null;
}

export function formToUrl(data: FormData): string {
  const params = new URLSearchParams();

  for (const key of STRING_FIELDS) {
    if (data[key]) params.set(key, data[key]);
  }
  for (const key of BOOL_FIELDS) {
    if (data[key]) params.set(key, '1');
  }

  const base = window.location.origin + window.location.pathname;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function useSyncFormToUrl(data: FormData) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 首次渲染不写入 URL（可能是从 URL 读取的）
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const url = formToUrl(data);
    window.history.replaceState(null, '', url);
  }, [data]);
}
