export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export const STORAGE_KEY = 'sci-calc-history';
const MAX_ENTRIES = 100;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        e && typeof e.expression === 'string' && typeof e.result === 'string' && typeof e.id === 'string',
    );
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* storage full or unavailable — history is best-effort */
  }
}

// ---- Theme persistence ----
export type Theme = 'dark' | 'light';
const THEME_KEY = 'sci-calc-theme';

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    /* localStorage unavailable */
  }
  return 'dark';
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* localStorage unavailable */
  }
}
