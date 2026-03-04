import React from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useJoinForm } from '../hooks/useJoinForm';

export const JoinForm: React.FC = () => {
  const { formData, isRegisterMode, error, handleChange, handleSubmit, toggleMode } = useJoinForm();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 font-sans text-slate-200">
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
            name="username" 
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          {!isRegisterMode && (
            <Input
              name="room"
              placeholder="Room Name"
              value={formData.room}
              onChange={handleChange}
              required
            />
          )}

          <Button type="submit" className="w-full mt-2">
            {isRegisterMode ? 'Sign Up' : 'Join Room'}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
          <Button type="button" variant="text" onClick={toggleMode}>
            {isRegisterMode ? 'Log In' : 'Sign Up'}
          </Button>
        </p>
      </form>
    </div>
  );
};