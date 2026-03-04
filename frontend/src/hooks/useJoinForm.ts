import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const useJoinForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '', room: '' });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegisterMode) {
        await register(formData.username, formData.password);
        alert('Registration successful! Please log in.');
        setIsRegisterMode(false);
      } else {
        if (!formData.room) return setError('Room is required');
        await login(formData.username, formData.password, formData.room);
      }
    } catch {
      setError(isRegisterMode ? 'Registration failed' : 'Login failed');
    }
  };

  return { formData, isRegisterMode, error, handleChange, handleSubmit, toggleMode };
};