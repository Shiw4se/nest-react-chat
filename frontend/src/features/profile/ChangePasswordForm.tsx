import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';

interface Props {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  onCancel: () => void;
}

// Mirrors the backend rule (ChangePasswordDto / AuthDto)
const PASSWORD_RULE = /(?=.*[A-Za-z])(?=.*\d)/;

const fieldClass =
  'w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-[15px] text-slate-50 placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30';

export const ChangePasswordForm: React.FC<Props> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const tooWeak = next.length > 0 && (next.length < 8 || !PASSWORD_RULE.test(next));
  const mismatch = confirm.length > 0 && confirm !== next;
  const canSubmit = current.length > 0 && next.length > 0 && !tooWeak && confirm === next && !isSaving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    await onSubmit(current, next);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-6 space-y-4">
      <p className="text-sm text-slate-400">{t('auth.password_hint')}</p>

      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder={t('profile.current_password')}
        aria-label={t('profile.current_password')}
        autoComplete="current-password"
        className={fieldClass}
        required
      />

      <div>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder={t('profile.new_password')}
          aria-label={t('profile.new_password')}
          aria-invalid={tooWeak}
          autoComplete="new-password"
          maxLength={72}
          className={fieldClass}
          required
        />
        {tooWeak && <p className="mt-1 text-xs text-amber-400 px-1">{t('profile.password_weak')}</p>}
      </div>

      <div>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t('profile.confirm_password')}
          aria-label={t('profile.confirm_password')}
          aria-invalid={mismatch}
          autoComplete="new-password"
          maxLength={72}
          className={fieldClass}
          required
        />
        {mismatch && <p className="mt-1 text-xs text-red-400 px-1">{t('profile.password_mismatch')}</p>}
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 min-h-11">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button type="submit" disabled={!canSubmit} className="flex-1 min-h-11">
          {isSaving ? t('profile.saving') : t('profile.change_password_btn')}
        </Button>
      </div>
    </form>
  );
};
