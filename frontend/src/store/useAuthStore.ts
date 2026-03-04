import { create } from 'zustand';
import type { UserData } from '../types/auth'; 
import axios from '../api/axios'; 

interface AuthState {
  user: UserData | null;
  token: string | null;
  setAuth: (user: UserData, token: string) => void;
  login: (username: string, password: string, room: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'), 
  
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },

  login: async (username, password, room) => {
    try {
      const res = await axios.post('/auth/login', {
        username,
        password,
      });
      
      const token = res.data.access_token;
      const user = { username, room } as UserData;
      
      localStorage.setItem('token', token);
      set({ user, token });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },
  
  clearAuth: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  register: async (username, password) => {
    try {
      await axios.post('/auth/register', {
        username,
        password,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },
}));