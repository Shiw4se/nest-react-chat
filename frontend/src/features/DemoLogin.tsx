import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useAuthStore } from '../store/useAuthStore';
import { getApiErrorMessage } from '../api/axios';
import { demoConfig } from '../utils/demoConfig';

export const DemoLogin: React.FC<{ config?: ReturnType<typeof demoConfig> }> = ({
  config = demoConfig(),
}) => {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const [busy, setBusy] = useState<string | null>(null);

  if (!config) return null;
  const [main, ...others] = config.accounts;

  const signIn = async (username: string) => {
    setBusy(username);
    try {
      await login(username, config.password);
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('auth.login_failed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      className="mb-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm"
      aria-labelledby="demo-title"
    >
      <h2 id="demo-title" className="font-semibold text-slate-50 flex items-center gap-2">
        <Icon name="chat" size={16} className="text-sky-400" />
        {t('demo.title')}
      </h2>
      <p className="mt-1 text-slate-400">{t('demo.text')}</p>
      <Button
        type="button"
        onClick={() => signIn(main)}
        disabled={busy !== null}
        className="w-full mt-3 min-h-11"
        data-testid="demo-login"
      >
        {busy === main ? t('demo.signing_in') : t('demo.button')}
      </Button>
      {others.length > 0 && (
        <p className="mt-3 text-xs text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>{t('demo.second_window')}</span>
          {others.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => signIn(name)}
              disabled={busy !== null}
              className="font-semibold text-sky-400 hover:underline disabled:opacity-50"
            >
              {name}
            </button>
          ))}
        </p>
      )}
    </section>
  );
};
