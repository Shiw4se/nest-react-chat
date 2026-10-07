import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { UsersApi } from '../../api/services/usersApi';
import { getApiErrorMessage } from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { nameOf } from '../../utils/displayName';
import type { UserProfile } from '../../types/user';
import { EditProfileForm } from './EditProfileForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { InlineBio } from './InlineBio';
import { PresenceLabel } from '../presence/PresenceLabel';
import { usePresence } from '../../store/usePresenceStore';

interface Props {
  userId: string;
  onClose: () => void;
}

type Mode = 'view' | 'edit' | 'password';

/** Telegram-style profile: own profile is editable, anyone else's is read-only. */
export const ProfilePanel: React.FC<Props> = ({ userId, onClose }) => {
  const { t, i18n } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.clearAuth);
  const updateAuthor = useChatStore((s) => s.updateAuthor);
  const isMe = userId === currentUserId;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('view');
  const panelRef = useFocusTrap(true, onClose);
  const { isOnline } = usePresence(userId, { isOnline: profile?.isOnline });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = isMe ? await UsersApi.getMe() : await UsersApi.getUser(userId);
        if (!cancelled) setProfile(data);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, isMe]);

  const handleSaveProfile = async (displayName: string, bio: string) => {
    try {
      const updated = await UsersApi.updateMe({ displayName, bio });
      setProfile((p) => (p ? { ...p, ...updated } : p));
      updateUser({ displayName: updated.displayName });
      updateAuthor(updated.id, { displayName: updated.displayName });
      toast.success(t('profile.saved'));
      setMode('view');
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('profile.save_error'));
    }
  };

  const handleSaveBio = async (bio: string): Promise<boolean> => {
    try {
      const updated = await UsersApi.updateMe({ bio });
      setProfile((p) => (p ? { ...p, bio: updated.bio } : p));
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('profile.save_error'));
      return false;
    }
  };

  const applyAvatar = (updated: Omit<UserProfile, 'stats'>) => {
    setProfile((p) => (p ? { ...p, avatarUrl: updated.avatarUrl } : p));
    updateUser({ avatarUrl: updated.avatarUrl });
    updateAuthor(updated.id, { avatarUrl: updated.avatarUrl });
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      applyAvatar(await UsersApi.uploadAvatar(file));
      toast.success(t('profile.avatar_updated'));
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('profile.avatar_error'));
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      applyAvatar(await UsersApi.removeAvatar());
      toast.success(t('profile.avatar_removed'));
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('profile.avatar_error'));
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await UsersApi.changePassword(currentPassword, newPassword);
      toast.success(t('profile.password_changed'));
      setMode('view');
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('profile.password_error'));
    }
  };

  const title =
    mode === 'edit'
      ? t('profile.edit')
      : mode === 'password'
        ? t('profile.change_password')
        : isMe
          ? t('profile.my_profile')
          : t('profile.title');

  return (
    <>
      <div
        className="fixed inset-0 z-[54] bg-black/50 backdrop-blur-[2px] md:bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="fixed z-[55] inset-y-0 right-0 w-full md:w-[380px] bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right"
      >
        <header className="flex items-center gap-2 px-3 py-3 border-b border-slate-700/70 shrink-0">
          {mode === 'view' ? (
            <Button variant="icon" onClick={onClose} aria-label={t('common.close', 'Close')}>
              <Icon name="close" />
            </Button>
          ) : (
            <Button variant="icon" onClick={() => setMode('view')} aria-label={t('common.back_short', 'Back')}>
              <Icon name="back" />
            </Button>
          )}
          <h2 id="profile-title" className="flex-1 text-base font-semibold text-slate-50">
            {title}
          </h2>
          {isMe && mode === 'view' && profile && (
            <Button variant="icon" onClick={() => setMode('edit')} aria-label={t('profile.edit')} title={t('profile.edit')}>
              <Icon name="edit" size={18} />
            </Button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 animate-pulse" role="status">
              {t('chat.loading')}
            </div>
          ) : !profile ? (
            <div className="p-8 text-center text-slate-500">{t('profile.load_error')}</div>
          ) : mode === 'edit' ? (
            <EditProfileForm
              profile={profile}
              onSave={handleSaveProfile}
              onUploadAvatar={handleUploadAvatar}
              onRemoveAvatar={handleRemoveAvatar}
              onCancel={() => setMode('view')}
            />
          ) : mode === 'password' ? (
            <ChangePasswordForm onSubmit={handleChangePassword} onCancel={() => setMode('view')} />
          ) : (
            <>
              <section className="flex flex-col items-center text-center px-6 pt-8 pb-6">
                <Avatar
                  name={nameOf(profile)}
                  seed={profile.username}
                  src={profile.avatarUrl}
                  online={isOnline}
                  size="xl"
                  className="shadow-xl"
                />
                <h3 className="mt-4 text-xl font-bold text-slate-50 break-all">{nameOf(profile)}</h3>
                <PresenceLabel
                  userId={profile.id}
                  isOnline={profile.isOnline}
                  lastSeenAt={profile.lastSeenAt}
                  className="mt-0.5 text-sm"
                />
              </section>

              <dl className="border-t border-slate-700/70 py-2">
                {isMe ? (
                  <InlineBio value={profile.bio} onSave={handleSaveBio} />
                ) : (
                  <InfoRow icon="info" label={t('profile.bio')}>
                    {profile.bio ? (
                      <span className="whitespace-pre-wrap break-words">{profile.bio}</span>
                    ) : (
                      <span className="text-slate-500 italic">{t('profile.bio_empty')}</span>
                    )}
                  </InfoRow>
                )}
                <InfoRow icon="at" label={t('profile.username')}>
                  @{profile.username}
                </InfoRow>
                <InfoRow icon="calendar" label={t('profile.joined')}>
                  {new Date(profile.createdAt).toLocaleDateString(i18n.language, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </InfoRow>
              </dl>

              <section className="border-t border-slate-700/70 grid grid-cols-3 text-center py-4">
                <Stat value={profile.stats.rooms} label={t('profile.stats_rooms')} />
                <Stat value={profile.stats.ownedRooms} label={t('profile.stats_owned')} />
                <Stat value={profile.stats.messages} label={t('profile.stats_messages')} />
              </section>

              {isMe && (
                <section className="border-t border-slate-700/70 py-2">
                  <ActionRow icon="edit" label={t('profile.edit')} onClick={() => setMode('edit')} />
                  <ActionRow
                    icon="key"
                    label={t('profile.change_password')}
                    onClick={() => setMode('password')}
                  />
                  <ActionRow
                    icon="logout"
                    label={t('common.logout', 'Log out')}
                    danger
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                  />
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

const InfoRow: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="flex gap-4 px-5 py-3">
    <Icon name={icon} size={20} className="text-slate-500 mt-0.5" />
    <div className="min-w-0">
      <dd className="text-[15px] text-slate-100">{children}</dd>
      <dt className="text-xs text-slate-500 mt-0.5">{label}</dt>
    </div>
  </div>
);

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div>
    <div className="text-lg font-bold text-slate-50 tabular-nums">{value}</div>
    <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
  </div>
);

const ActionRow: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  danger?: boolean;
  onClick: () => void;
}> = ({ icon, label, danger = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-3 text-[15px] text-left transition-colors focus:outline-none focus-visible:bg-slate-700/60 ${
      danger ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-200 hover:bg-slate-700/50'
    }`}
  >
    <Icon name={icon} size={20} className={danger ? '' : 'text-slate-500'} />
    {label}
  </button>
);
