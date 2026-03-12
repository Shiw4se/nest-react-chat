import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useJoinForm } from '../hooks/useJoinForm';

export const JoinForm: React.FC = () => {
  const { t } = useTranslation();
  const { formData, isRegisterMode, error, handleChange, handleSubmit, toggleMode } = useJoinForm();

  return (
    <div 
      className="flex items-center justify-center min-h-[100dvh] bg-slate-900 font-sans text-slate-200 p-4"
    >
      <main className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl w-full border border-slate-700"
          aria-labelledby="auth-title"
        >
          <h2 id="auth-title" className="text-2xl sm:text-3xl font-bold mb-6 text-center text-white">
            {isRegisterMode ? t('auth.create_account') : t('auth.log_in')}
          </h2>

          {error && (
            <div 
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              name="username"
              placeholder={t('auth.username')}
              value={formData.username}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!error}
              className="min-h-[44px] focus:ring-2 focus:ring-blue-500"
            />
            <Input
              name="password"
              type="password"
              placeholder={t('auth.password')}
              value={formData.password}
              onChange={handleChange}
              required
              aria-required="true"
              aria-invalid={!!error}
              className="min-h-[44px] focus:ring-2 focus:ring-blue-500"
            />

            <Button 
              type="submit" 
              className="w-full mt-2 min-h-[44px] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 text-base"
            >
              {isRegisterMode ? t('auth.sign_up_btn') : t('auth.log_in_btn')}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-0">
            <span>{isRegisterMode ? t('auth.already_have_account') : t('auth.dont_have_account')}</span>
            <Button 
              type="button" 
              variant="text" 
              onClick={toggleMode}
              className="min-h-[44px] sm:min-h-0 focus:ring-2 focus:ring-blue-500 px-2"
            >
              {isRegisterMode ? t('auth.log_in_link') : t('auth.sign_up_link')}
            </Button>
          </p>
        </form>
      </main>
    </div>
  );
};