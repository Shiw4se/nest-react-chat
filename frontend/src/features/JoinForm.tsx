import React, { useState } from 'react';
import api from '../api/axios';
import { socket } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import type { AuthResponse } from '../types/auth';

export const JoinForm: React.FC = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({ username: '', password: '', room: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      const { username, room } = formData;

      setAuth({ username, room }, data.access_token);

      socket.auth = { token: data.access_token };
      socket.connect();
      socket.emit('join', { room, username });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials or backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700"
      >
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
          Join Chat Room
        </h2>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <input
            type="text"
            placeholder="Username"
            required
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500"
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            type="text"
            placeholder="Room ID"
            required
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-white placeholder:text-slate-500"
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
          />
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Enter Chat'}
          </button>
        </div>
      </form>
    </div>
  );
};