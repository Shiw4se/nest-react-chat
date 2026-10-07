export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark'];

/** Keep in sync with the inline script in index.html */
export const resolveTheme = (pref: ThemePreference, systemPrefersLight: boolean): ResolvedTheme =>
  pref === 'system' ? (systemPrefersLight ? 'light' : 'dark') : pref;

export const nextTheme = (pref: ThemePreference): ThemePreference =>
  THEME_ORDER[(THEME_ORDER.indexOf(pref) + 1) % THEME_ORDER.length];

/** Browser chrome colour (mobile address bar) per theme */
export const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: '#0f172a',
  light: '#ffffff',
};
