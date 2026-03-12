import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders the input with the correct placeholder', () => {
    render(<Input placeholder="Type message..." />);
    expect(screen.getByPlaceholderText('Type message...')).toBeInTheDocument();
  });

  it('allows the user to type text', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Test input" />);

    const input = screen.getByPlaceholderText('Test input');
    await user.type(input, 'My new message');

    expect(input).toHaveValue('My new message');
  });
});
