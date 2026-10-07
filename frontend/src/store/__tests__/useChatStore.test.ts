import { describe, it, expect, beforeEach } from 'vitest';
import type { ChatMessage } from '../../types/chat';
import { useChatStore } from '../useChatStore';

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      typingUsers: [],
      isConnected: false,
      isReconnecting: false,
    });
  });

  it('should add a new message to the state', () => {
    const mockMessage: ChatMessage = {
      id: 'msg-1',
      message: 'Hello team',
      roomId: 'room-1',
      userId: 'user-1',
      user: { username: 'Andrew' },
      createdAt: '2026-01-01T10:00:00.000Z',
    };

    useChatStore.getState().addMessage(mockMessage);

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].message).toBe('Hello team');
  });

  it('should manage the typing status of users', () => {
    useChatStore.getState().setTyping('Alice', true);
    expect(useChatStore.getState().typingUsers).toContain('Alice');

    useChatStore.getState().setTyping('Alice', false);
    expect(useChatStore.getState().typingUsers).not.toContain('Alice');
  });

  it('should update connection statuses', () => {
    useChatStore.getState().setIsConnected(true);
    expect(useChatStore.getState().isConnected).toBe(true);

    useChatStore.getState().setIsReconnecting(true);
    expect(useChatStore.getState().isReconnecting).toBe(true);
  });
});

describe('useChatStore replies and edits', () => {
  const base = {
    roomId: 'r1',
    userId: 'u1',
    user: { username: 'ann' },
    createdAt: '2026-10-07T10:00:00Z',
  };

  it('updates an edited message and the quotes that reference it', () => {
    useChatStore.getState().setMessages([
      { ...base, id: 'a', message: 'old' },
      { ...base, id: 'b', message: 'reply', replyToId: 'a', replyTo: { id: 'a', message: 'old', userId: 'u1', user: { username: 'ann' } } },
    ]);
    useChatStore.getState().updateMessage({ ...base, id: 'a', message: 'new', editedAt: '2026-10-07T10:05:00Z' });

    const [a, b] = useChatStore.getState().messages;
    expect(a.message).toBe('new');
    expect(a.editedAt).toBeTruthy();
    expect(b.replyTo?.message).toBe('new');
  });

  it('drops quotes of a deleted message', () => {
    useChatStore.getState().setMessages([
      { ...base, id: 'a', message: 'old' },
      { ...base, id: 'b', message: 'reply', replyToId: 'a', replyTo: { id: 'a', message: 'old', userId: 'u1', user: { username: 'ann' } } },
    ]);
    useChatStore.getState().removeMessage('a');

    const messages = useChatStore.getState().messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].replyTo).toBeNull();
  });
});
