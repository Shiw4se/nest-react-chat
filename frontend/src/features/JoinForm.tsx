import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { LanguageSwitcher } from './chat/components/LanguageSwitcher';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useJoinForm } from '../hooks/useJoinForm';
import { DemoLogin } from './DemoLogin';

export const JoinForm: React.FC = () => {
  const { t } = useTranslation();
  const { formData, isRegisterMode, error, handleChange, handleSubmit, toggleMode } = useJoinForm();

  return (
    <div className="chat-bg flex items-center justify-center min-h-[100dvh] text-slate-200 p-4">
      <main className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-blue-900/40">
            <Icon name="chat" size={30} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-50">
            {isRegisterMode ? t('auth.create_account') : t('auth.log_in')}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{t('auth.tagline', 'Fast, simple chat rooms.')}</p>
        </div>

        {!isRegisterMode && <DemoLogin />}

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/90 backdrop-blur p-6 sm:p-7 rounded-2xl shadow-2xl w-full border border-slate-700/70"
          aria-labelledby="auth-title"
        >
          <h2 id="auth-title" className="sr-only">
            {isRegisterMode ? t('auth.create_account') : t('auth.log_in')}
          </h2>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-red-300 text-sm text-center"
            >
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Input
              name="username"
              placeholder={t('auth.username')}
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              aria-required="true"
              aria-invalid={!!error}
            />
            <Input
              name="password"
              type="password"
              placeholder={t('auth.password')}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={isRegisterMode ? 'password-hint' : undefined}
            />
            {isRegisterMode && (
              <p id="password-hint" className="text-xs text-slate-500 px-1">
                {t('auth.password_hint')}
              </p>
            )}
            <Button type="submit" className="w-full mt-2 min-h-12 text-base">
              {isRegisterMode ? t('auth.sign_up_btn') : t('auth.log_in_btn')}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-0">
            <span>
              {isRegisterMode ? t('auth.already_have_account') : t('auth.dont_have_account')}
            </span>
            <Button type="button" variant="text" onClick={toggleMode} className="min-h-[44px] sm:min-h-0 px-2">
              {isRegisterMode ? t('auth.log_in_link') : t('auth.sign_up_link')}
            </Button>
          </p>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
};
