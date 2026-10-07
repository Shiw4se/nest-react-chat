import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

interface Props {
  src: string;
  caption?: string;
  onClose: () => void;
}

/** Full-screen image viewer: Esc, the close button or a click outside closes it. */
export const Lightbox: React.FC<Props> = ({ src, caption, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('attachment.viewer')}
      className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4 animate-pop"
      onClick={onClose}
    >
      <div className="absolute top-3 right-3 flex gap-2">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium inline-flex items-center"
        >
          {t('attachment.open_original')}
        </a>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
        >
          <Icon name="close" />
        </button>
      </div>
      <img
        src={src}
        alt={caption || ''}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
      />
      {caption && (
        <p className="mt-3 max-w-2xl text-center text-sm text-slate-200 whitespace-pre-wrap">{caption}</p>
      )}
    </div>
  );
};
