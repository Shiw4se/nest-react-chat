import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface ChatState {
  messages: ChatMessage[];
  typingUsers: string[];
  isConnected: boolean;
  isReconnecting: boolean;
  hasMore: boolean;

  setIsConnected: (status: boolean) => void;
  setIsReconnecting: (status: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  prependMessages: (msgs: ChatMessage[]) => void;
  setHasMore: (status: boolean) => void;
  setTyping: (username: string, isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingUsers: [],
  isConnected: false,
  isReconnecting: false,
  hasMore: true,

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),

  prependMessages: (msgs) => set((state) => ({ messages: [...msgs, ...state.messages] })),

  setTyping: (username, isTyping) =>
    set((state) => {
      if (isTyping) {
        return { typingUsers: Array.from(new Set([...state.typingUsers, username])) };
      }
      return { typingUsers: state.typingUsers.filter((u) => u !== username) };
    }),

  setIsConnected: (status) => set({ isConnected: status }),
  setIsReconnecting: (status) => set({ isReconnecting: status }),

  setHasMore: (status) => set({ hasMore: status }),

  clearMessages: () => set({ messages: [], typingUsers: [], hasMore: true }),
}));
