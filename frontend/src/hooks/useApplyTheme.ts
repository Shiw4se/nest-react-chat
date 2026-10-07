import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { resolveTheme, THEME_COLOR } from '../utils/theme';

const LIGHT_QUERY = '(prefers-color-scheme: light)';

/**
 * Puts the resolved theme on <html data-theme>, follows OS changes while the
 * preference is "system", and keeps the browser chrome colour in sync.
 */
export const useApplyTheme = () => {
  const preference = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia?.(LIGHT_QUERY);

    const apply = (animate: boolean) => {
      const theme = resolveTheme(preference, !!media?.matches);
      if (root.dataset.theme === theme) return;
      if (animate) {
        root.classList.add('theme-transition');
        window.setTimeout(() => root.classList.remove('theme-transition'), 250);
      }
      root.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
    };

    apply(true);
    if (preference !== 'system' || !media) return;
    const onChange = () => apply(true);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);
};
