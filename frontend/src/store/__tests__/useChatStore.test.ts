import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../useChatStore';

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ 
      messages: [], 
      typingUsers: [], 
      isConnected: false, 
      isReconnecting: false 
    });
  });

  it('should add a new message to the state', () => {
    const mockMessage = { message: 'Hello team', user: { username: 'Andrew' } }; 
    
    useChatStore.getState().addMessage(mockMessage as any);
    
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