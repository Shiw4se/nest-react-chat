import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface ChatState {
  messages: ChatMessage[];
  typingUsers: string[]; 
  isConnected: boolean;
  isReconnecting: boolean;
  setIsConnected: (status: boolean) => void;
  setIsReconnecting: (status: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setTyping: (username: string, isTyping: boolean) => void; 
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingUsers: [],
  
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  
  setTyping: (username, isTyping) => set((state) => {
    if (isTyping) {
      return { typingUsers: Array.from(new Set([...state.typingUsers, username])) };
    } else {
      return { typingUsers: state.typingUsers.filter((u) => u !== username) };
    }
  }),
  
  isConnected: false,
  isReconnecting: false,
  setIsConnected: (status) => set({ isConnected: status }),
  setIsReconnecting: (status) => set({ isReconnecting: status }),

  clearMessages: () => set({ messages: [], typingUsers: [] }),
}));