import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../config/i18n';
import { nextTheme, resolveTheme } from './theme';
import { useUIStore } from '../store/useUIStore';
import { useApplyTheme } from '../hooks/useApplyTheme';
import { ThemeToggle } from '../components/ui/ThemeToggle';

describe('theme helpers', () => {
  it('resolves "system" from the OS preference', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('cycles system → light → dark → system', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });
});

describe('useApplyTheme + ThemeToggle', () => {
  let osLight = false;
  const listeners = new Set<() => void>();

  beforeEach(() => {
    osLight = false;
    listeners.clear();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      get matches() {
        return osLight;
      },
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    }));
    useUIStore.setState({ theme: 'system' });
    delete document.documentElement.dataset.theme;
  });

  const Harness = () => {
    useApplyTheme();
    return <ThemeToggle />;
  };

  it('applies the theme to <html> and follows the OS while on "system"', () => {
    render(<Harness />);
    expect(document.documentElement.dataset.theme).toBe('dark');

    osLight = true;
    act(() => listeners.forEach((cb) => cb()));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('the toggle cycles and persists the preference', () => {
    render(<Harness />);
    const toggle = screen.getByTestId('theme-toggle');
    expect(toggle).toHaveAccessibleName('Theme: system');

    fireEvent.click(toggle);
    expect(useUIStore.getState().theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByTestId('theme-toggle')).toHaveAccessibleName('Theme: dark');
  });
});
