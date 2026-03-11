import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/services/authApi';
import type { UserData } from '../types/auth';
import { useRoomStore } from '../store/useRoomStore';
import { useChatStore } from '../store/useChatStore';

interface AuthState {
  user: UserData | null;
  token: string | null;
  setAuth: (user: UserData, token: string) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      login: async (username, password) => {
        useRoomStore.getState().clearRooms();
        useChatStore.getState().clearMessages();

        const data = await authApi.login(username, password);
        const token = data.accessToken;
        const user = { id: data.user.id, username: data.user.username } as UserData;
        set({ user, token });
      },

      register: async (username, password) => {
        await authApi.register(username, password);
      },

      clearAuth: () => {
        set({ user: null, token: null });
        useRoomStore.getState().clearRooms();
        useChatStore.getState().clearMessages();
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
);