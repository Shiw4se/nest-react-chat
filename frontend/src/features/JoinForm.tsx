import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

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
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {!isRegisterMode && (
            <Input
              type="text"
              placeholder="Room Name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              required
            />
          )}

          <Button type="submit" className="w-full mt-2">
            {isRegisterMode ? 'Sign Up' : 'Join Room'}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
          <Button
            type="button"
            variant="text"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
          >
            {isRegisterMode ? 'Log In' : 'Sign Up'}
          </Button>
        </p>
      </form>
    </div>
  );
};