import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';
import { useUIStore } from '../../store/useUIStore';
import { nextTheme } from '../../utils/theme';

const ICONS = { system: 'monitor', light: 'sun', dark: 'moon' } as const;

/** Cycles system → light → dark; the label always names the current mode. */
export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const label = t('theme.label', { mode: t(`theme.${theme}`) });

  return (
    <Button
      variant="icon"
      onClick={() => setTheme(nextTheme(theme))}
      aria-label={label}
      title={label}
      data-testid="theme-toggle"
    >
      <Icon name={ICONS[theme]} size={18} />
    </Button>
  );
};
