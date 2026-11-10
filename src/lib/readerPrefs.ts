// Reading preferences: theme and text size, kept in this browser.
import { useSyncExternalStore } from 'react';

export const READER_THEMES = [
  { id: 'night', label: 'Night', hint: 'Navy sky, cream text' },
  { id: 'paper', label: 'Paper', hint: 'Cream page, dark ink' },
  { id: 'contrast', label: 'High contrast', hint: 'Black and white, bright gold' },
] as const;

export type ReaderTheme = (typeof READER_THEMES)[number]['id'];

export const TEXT_SIZES = [16, 17, 19, 21, 23, 26] as const;
export const DEFAULT_SIZE = 19;

const CHANGED = 'reader-prefs-changed';

/** Older saved themes (day, sepia) read as Paper. */
export function normalizeTheme(raw: string | null): ReaderTheme {
  if (raw === 'paper' || raw === 'day' || raw === 'sepia') return 'paper';
  if (raw === 'contrast') return 'contrast';
  return 'night';
}

/** Snap any saved size (the old reader allowed 14–28) to the nearest step. */
export function normalizeSize(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_SIZE;
  return TEXT_SIZES.reduce((best, s) => (Math.abs(s - n) < Math.abs(best - n) ? s : best), DEFAULT_SIZE);
}

function get(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGED));
}

export const setTheme = (t: ReaderTheme) => set('theme', t);
export const setTextSize = (px: number) => set('fontSize', String(normalizeSize(String(px))));

export function stepTextSize(current: number, dir: 1 | -1) {
  const i = TEXT_SIZES.indexOf(current as (typeof TEXT_SIZES)[number]);
  const next = TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, Math.max(0, (i < 0 ? 2 : i) + dir))];
  setTextSize(next);
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGED, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGED, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useReaderPrefs() {
  const theme = useSyncExternalStore(subscribe, () => normalizeTheme(get('theme')), () => 'night' as ReaderTheme);
  const size = useSyncExternalStore(subscribe, () => normalizeSize(get('fontSize')), () => DEFAULT_SIZE);
  return { theme, size };
}
