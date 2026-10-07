import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { nameOf } from '../../utils/displayName';
import type { UserProfile } from '../../types/user';
import { BIO_MAX } from './InlineBio';

const DISPLAY_NAME_MAX = 40;
// Mirrors the backend limits (AvatarStorageService)
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface Props {
  profile: UserProfile;
  onSave: (displayName: string, bio: string) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
  onCancel: () => void;
}

const fieldClass =
  'w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-[15px] text-slate-50 placeholder:text-slate-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30';

export const EditProfileForm: React.FC<Props> = ({
  profile,
  onSave,
  onUploadAvatar,
  onRemoveAvatar,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Release the local preview URL when it is replaced or the form closes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const isDirty = displayName !== (profile.displayName ?? '') || bio !== (profile.bio ?? '');
  const previewName = nameOf({ username: profile.username, displayName });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return onCancel();
    setIsSaving(true);
    await onSave(displayName, bio);
    setIsSaving(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error(t('profile.avatar_type_error'));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(t('profile.avatar_size_error'));
      return;
    }

    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      await onUploadAvatar(file);
    } finally {
      setIsUploading(false);
      setPreview(null);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      await onRemoveAvatar();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 py-6 space-y-5">
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="group relative rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 disabled:cursor-wait"
          aria-label={t('profile.avatar_change')}
        >
          <Avatar
            name={previewName}
            seed={profile.username}
            src={preview ?? profile.avatarUrl}
            size="xl"
            className="shadow-xl"
          />
          <span
            className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/45 text-white transition-opacity ${
              isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            }`}
            aria-hidden="true"
          >
            {isUploading ? (
              <span className="h-7 w-7 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <Icon name="camera" size={28} />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          onChange={handleFile}
          className="hidden"
          data-testid="avatar-input"
        />

        <div className="mt-3 flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-sky-400 hover:text-sky-300 font-medium disabled:opacity-50"
          >
            {profile.avatarUrl ? t('profile.avatar_change') : t('profile.avatar_upload')}
          </button>
          {profile.avatarUrl && (
            <>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
              >
                {t('profile.avatar_remove')}
              </button>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">{t('profile.avatar_hint')}</p>
      </div>

      <div>
        <label htmlFor="profile-display-name" className="block text-xs font-medium text-slate-400 mb-1.5 px-1">
          {t('profile.display_name')}
        </label>
        <input
          id="profile-display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={DISPLAY_NAME_MAX}
          placeholder={profile.username}
          autoComplete="nickname"
          className={fieldClass}
        />
        <p className="mt-1 flex justify-between text-xs text-slate-500 px-1">
          <span>{t('profile.display_name_hint')}</span>
          <span className="tabular-nums">
            {displayName.length}/{DISPLAY_NAME_MAX}
          </span>
        </p>
      </div>

      <div>
        <label htmlFor="profile-bio" className="block text-xs font-medium text-slate-400 mb-1.5 px-1">
          {t('profile.bio')}
        </label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={3}
          placeholder={t('profile.bio_placeholder')}
          className={`${fieldClass} resize-none`}
        />
        <p className="mt-1 text-right text-xs text-slate-500 tabular-nums px-1">
          {bio.length}/{BIO_MAX}
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 min-h-11">
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button type="submit" disabled={isSaving || isUploading} className="flex-1 min-h-11">
          {isSaving ? t('profile.saving') : t('profile.save')}
        </Button>
      </div>
    </form>
  );
};
