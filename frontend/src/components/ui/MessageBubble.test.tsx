import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '../../config/i18n';
import type { ChatMessage } from '../../types/chat';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble Component', () => {
  const mockMsg: ChatMessage = {
    id: 'msg-1',
    message: 'Test message content',
    roomId: 'room-1',
    userId: 'user-1',
    user: { username: 'Alice' },
    createdAt: '2026-01-01T10:00:00.000Z',
  };

  it('renders an incoming message correctly', () => {
    render(<MessageBubble message={mockMsg} isMe={false} />);

    expect(screen.getByText('Test message content')).toBeInTheDocument();

    const bubble = screen.getByTestId('message-bubble');
    expect(bubble.className).toContain('bg-slate-700');
  });

  it('renders an outgoing message correctly (isMe=true)', () => {
    render(<MessageBubble message={mockMsg} isMe={true} />);

    const bubble = screen.getByTestId('message-bubble');
    expect(bubble.className).toContain('bg-blue-600');
  });
});

describe('MessageBubble reactions, replies and edits', () => {
  const msg = {
    id: 'm1',
    message: 'Hello',
    roomId: 'r1',
    userId: 'u2',
    user: { username: 'bob' },
    createdAt: '2026-10-07T10:00:00Z',
  };

  it('groups reactions, highlights mine and toggles on click', () => {
    const onReact = vi.fn();
    render(
      <MessageBubble
        message={{
          ...msg,
          reactions: [
            { emoji: '🔥', userId: 'me' },
            { emoji: '🔥', userId: 'u3' },
          ],
        }}
        isMe={false}
        currentUserId="me"
        onReact={onReact}
      />,
    );
    const chip = screen.getByRole('button', { name: /🔥, 2 reactions/ });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(chip);
    expect(onReact).toHaveBeenCalledWith('🔥');
  });

  it('shows the quoted message and the edited label', () => {
    const onQuoteClick = vi.fn();
    render(
      <MessageBubble
        message={{
          ...msg,
          editedAt: '2026-10-07T10:01:00Z',
          replyTo: { id: 'm0', message: 'Question', userId: 'u1', user: { username: 'ann' } },
        }}
        isMe={false}
        onQuoteClick={onQuoteClick}
      />,
    );
    expect(screen.getByText('edited')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Question'));
    expect(onQuoteClick).toHaveBeenCalledWith('m0');
  });
});
