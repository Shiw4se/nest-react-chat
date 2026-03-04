import { create } from 'zustand';
import type { UserData } from '../types/auth'; 

interface AuthState {
  user: UserData | null;
  token: string | null;
  setAuth: (user: UserData, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'), 
  
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));