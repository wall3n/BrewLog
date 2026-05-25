import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export type Theme = 'system' | 'light' | 'dark';

export function useTheme() {
  const { state, dispatch } = useApp();
  const theme = state.settings?.theme ?? 'system';

  useEffect(() => {
    let mode: string = theme;
    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('brewlog-theme', theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: t } });
  };

  return { theme, setTheme };
}
