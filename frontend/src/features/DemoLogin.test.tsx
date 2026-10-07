import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '../config/i18n';
import { DemoLogin } from './DemoLogin';
import { demoConfig } from '../utils/demoConfig';
import { useAuthStore } from '../store/useAuthStore';

describe('demoConfig', () => {
  it('needs both accounts and a password', () => {
    expect(demoConfig({})).toBeNull();
    expect(demoConfig({ VITE_DEMO_ACCOUNTS: 'demo' })).toBeNull();
    expect(demoConfig({ VITE_DEMO_ACCOUNTS: ' demo, alex ,', VITE_DEMO_PASSWORD: 'pw' })).toEqual({
      accounts: ['demo', 'alex'],
      password: 'pw',
    });
  });
});

describe('DemoLogin', () => {
  it('renders nothing when demo mode is off', () => {
    const { container } = render(<DemoLogin config={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('logs in as the main account or another one for a second window', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ login });
    render(<DemoLogin config={{ accounts: ['demo', 'alex'], password: 'Demo1234' }} />);

    fireEvent.click(screen.getByTestId('demo-login'));
    await waitFor(() => expect(login).toHaveBeenCalledWith('demo', 'Demo1234'));

    login.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'alex' }));
    await waitFor(() => expect(login).toHaveBeenCalledWith('alex', 'Demo1234'));
  });
});
