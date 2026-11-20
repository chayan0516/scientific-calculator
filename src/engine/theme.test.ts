import { describe, it, expect, vi } from 'vitest';
import { loadTheme, saveTheme } from './history';

// jsdom may not expose localStorage in this env; fall back to a stub so
// theme functions still exercise their logic.
if (typeof localStorage === 'undefined') {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  });
}

describe('theme persistence', () => {
  it('defaults to dark when nothing saved', () => {
    localStorage.removeItem('sci-calc-theme');
    expect(loadTheme()).toBe('dark');
  });

  it('saves and loads', () => {
    saveTheme('light');
    expect(localStorage.getItem('sci-calc-theme')).toBe('light');
    expect(loadTheme()).toBe('light');
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
  });
});
