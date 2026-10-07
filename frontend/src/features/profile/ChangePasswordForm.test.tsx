import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '../../config/i18n';
import { ChangePasswordForm } from './ChangePasswordForm';
import { nameOf } from '../../utils/displayName';

describe('ChangePasswordForm', () => {
  const setup = () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ChangePasswordForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    const submit = screen.getByRole('button', { name: /change password/i });
    return { onSubmit, submit };
  };

  it('blocks a weak new password', async () => {
    const { submit } = setup();
    await userEvent.type(screen.getByLabelText(/current password/i), 'OldPass123');
    await userEvent.type(screen.getByLabelText(/^new password/i), 'short');

    // inline warning (the hint above the fields also mentions the rule)
    expect(screen.getByText(/^At least 8 characters/)).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('blocks mismatched confirmation', async () => {
    const { submit } = setup();
    await userEvent.type(screen.getByLabelText(/current password/i), 'OldPass123');
    await userEvent.type(screen.getByLabelText(/^new password/i), 'NewPass456');
    await userEvent.type(screen.getByLabelText(/repeat new password/i), 'NewPass457');

    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('submits valid input', async () => {
    const { onSubmit, submit } = setup();
    await userEvent.type(screen.getByLabelText(/current password/i), 'OldPass123');
    await userEvent.type(screen.getByLabelText(/^new password/i), 'NewPass456');
    await userEvent.type(screen.getByLabelText(/repeat new password/i), 'NewPass456');
    await userEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledWith('OldPass123', 'NewPass456');
  });
});

describe('nameOf', () => {
  it('prefers the display name and falls back to the username', () => {
    expect(nameOf({ username: 'ann', displayName: 'Ann K.' })).toBe('Ann K.');
    expect(nameOf({ username: 'ann', displayName: '   ' })).toBe('ann');
    expect(nameOf({ username: 'ann' })).toBe('ann');
  });
});
