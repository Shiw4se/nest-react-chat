import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '../../../config/i18n';
import { Composer, type ComposerMode } from './Composer';
import type { ChatMessage } from '../../../types/chat';

const msg: ChatMessage = {
  id: 'm1',
  message: 'Original text',
  roomId: 'r1',
  userId: 'u1',
  user: { username: 'ann' },
  createdAt: '2026-10-07T10:00:00Z',
};

const setup = (mode: ComposerMode = null) => {
  const props = {
    onSend: vi.fn().mockReturnValue(true),
    onSaveEdit: vi.fn().mockReturnValue(true),
    onCancelMode: vi.fn(),
    onEditLast: vi.fn(),
    onTyping: vi.fn(),
  };
  const utils = render(<Composer mode={mode} {...props} />);
  const input = screen.getByRole('textbox', { name: /type a message/i });
  return { ...props, ...utils, input };
};

describe('Composer', () => {
  it('sends on Enter and clears the field', async () => {
    const { onSend, input } = setup();
    await userEvent.type(input, 'hello{Enter}');
    expect(onSend).toHaveBeenCalledWith('hello');
    expect(input).toHaveValue('');
  });

  it('keeps the text when sending fails', async () => {
    const { onSend, input } = setup();
    onSend.mockReturnValue(false);
    await userEvent.type(input, 'hello{Enter}');
    expect(input).toHaveValue('hello');
  });

  it('edits the last message on ArrowUp in an empty field', () => {
    const { onEditLast, input } = setup();
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onEditLast).toHaveBeenCalled();
  });

  it('shows who is being replied to and cancels on Escape', () => {
    const { onCancelMode, input } = setup({ type: 'reply', message: msg });
    expect(screen.getByText('Reply to ann')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancelMode).toHaveBeenCalled();
  });

  it('prefills the original text in edit mode and saves on Enter', async () => {
    const { onSaveEdit, input } = setup({ type: 'edit', message: msg });
    expect(input).toHaveValue('Original text');
    await userEvent.type(input, '!{Enter}');
    expect(onSaveEdit).toHaveBeenCalledWith(msg, 'Original text!');
  });

  it('clears the edited text when switching from edit to reply', () => {
    const { rerender, input, ...props } = setup({ type: 'edit', message: msg });
    rerender(<Composer mode={{ type: 'reply', message: msg }} {...props} />);
    expect(input).toHaveValue('');
  });
});
