import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    { name: 'cbt-theme' }
  )
);

// Apply theme on app load and when system preference changes
export function initTheme() {
  const stored = localStorage.getItem('cbt-theme');
  const theme: Theme = stored ? JSON.parse(stored)?.state?.theme || 'light' : 'light';
  applyTheme(theme);

  // React to OS dark/light mode changes when in system mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = useThemeStore.getState().theme;
    if (current === 'system') applyTheme('system');
  });
}