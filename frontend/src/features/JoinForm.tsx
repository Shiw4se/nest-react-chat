import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const JoinForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [room, setRoom] = useState('');
  
  const [isRegisterMode, setIsRegisterMode] = useState(false); 
  const [error, setError] = useState('');

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegisterMode) {
        await register(username, password);
        alert('Registration successful! Please log in.');
        setIsRegisterMode(false); 
      } else {
        if (!room) {
          setError('Room is required for login');
          return;
        }
        await login(username, password, room);
      }
    } catch (err) {
      setError(isRegisterMode ? 'Registration failed. Username might be taken.' : 'Login failed. Check credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans">
      <form 
        onSubmit={handleSubmit} 
        className="bg-slate-800 p-8 rounded-2xl shadow-xl w-96 border border-slate-700"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isRegisterMode ? 'Create Account' : 'Join Chat'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500 transition-all"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500 transition-all"
            required
          />
          
          {!isRegisterMode && (
            <input
              type="text"
              placeholder="Room Name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500 transition-all"
              required
            />
          )}

          <button 
            type="submit" 
            className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all active:scale-95 mt-2"
          >
            {isRegisterMode ? 'Sign Up' : 'Join Room'}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
          >
            {isRegisterMode ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
};