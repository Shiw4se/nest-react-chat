import { create } from 'zustand';
import type { ChatMessage, Reaction } from '../types/chat';

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
  removeMessage: (messageId: string) => void;
  /** Replaces an edited message and refreshes quotes of it */
  updateMessage: (msg: ChatMessage) => void;
  setReactions: (messageId: string, reactions: Reaction[]) => void;
  /** Applies a profile change to every loaded message by that author. */
  updateAuthor: (
    userId: string,
    patch: { displayName?: string | null; avatarUrl?: string | null },
  ) => void;
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

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages
        .filter((msg) => msg.id !== messageId)
        // The server nulls replyToId on delete; mirror it so quotes disappear now
        .map((msg) =>
          msg.replyToId === messageId ? { ...msg, replyToId: null, replyTo: null } : msg,
        ),
    })),

  setReactions: (messageId, reactions) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, reactions } : msg)),
    })),

  updateMessage: (updated) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === updated.id) return { ...msg, ...updated };
        if (msg.replyTo?.id === updated.id) {
          return { ...msg, replyTo: { ...msg.replyTo, message: updated.message } };
        }
        return msg;
      }),
    })),

  updateAuthor: (userId, patch) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.userId === userId ? { ...m, user: { ...m.user, ...patch } } : m,
      ),
    })),

  clearMessages: () => set({ messages: [], typingUsers: [], hasMore: true }),
}));
