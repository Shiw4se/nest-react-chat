import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

export const useJoinForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '', room: '' });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

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
        toast.success(t('auth.registration_success'));
        setIsRegisterMode(false);
      } else {
        if (!formData.room) return setError(t('auth.room_required'));
        await login(formData.username, formData.password, formData.room);
      }
    } catch {
      const errorMessage = isRegisterMode ? t('auth.registration_failed') : t('auth.login_failed');
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return { formData, isRegisterMode, error, handleChange, handleSubmit, toggleMode };
};
