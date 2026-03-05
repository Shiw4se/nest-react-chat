import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/services/authApi';
import type { UserData } from '../types/auth';

interface AuthState {
  user: UserData | null;
  token: string | null;
  setAuth: (user: UserData, token: string) => void;
  login: (username: string, password: string, room: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      login: async (username, password, room) => {
        const data = await authApi.login(username, password);
        const token = data.access_token;
        const user = { username, room } as UserData;

        set({ user, token });
      },

      register: async (username, password) => {
        await authApi.register(username, password);
      },

      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    },
  ),
);
