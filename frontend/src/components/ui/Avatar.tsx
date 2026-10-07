import React, { useState } from 'react';
import { avatarGradient, initialsOf } from '../../utils/avatar';
import { mediaUrl } from '../../utils/mediaUrl';

const SIZES = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-4xl',
} as const;

interface AvatarProps {
  /** Used for the initials */
  name: string;
  /** Used for the colour; defaults to `name`. Pass the username so renaming keeps the colour. */
  seed?: string;
  /** Photo path from the backend or a local preview URL; falls back to initials. */
  src?: string | null;
  size?: keyof typeof SIZES;
  /** Rounded squares for rooms, circles for people */
  shape?: 'circle' | 'rounded';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  seed,
  src,
  size = 'md',
  shape = 'circle',
  className = '',
}) => {
  const url = mediaUrl(src);
  // Remember which URL failed so a later, different src is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = !!url && url !== failedUrl;

  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden flex items-center justify-center font-bold text-white select-none bg-linear-to-br shadow-inner ${
        shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
      } ${SIZES[size]} ${avatarGradient(seed ?? name)} ${className}`}
    >
      {showPhoto ? (
        <img
          src={url}
          alt=""
          draggable={false}
          loading="lazy"
          onError={() => setFailedUrl(url)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        initialsOf(name)
      )}
    </div>
  );
};
