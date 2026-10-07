import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { messagesService } from '../../../api/services/messagesService';
import { getApiErrorMessage } from '../../../api/axios';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { nameOf } from '../../../utils/displayName';
import type { ChatMessage } from '../../../types/chat';

interface Props {
  roomId: string;
  file: File;
  replyTo?: ChatMessage | null;
  onClose: () => void;
  /** Called after a successful upload (the message itself arrives over the socket) */
  onSent: () => void;
}

/** Telegram-style "Send photo" dialog: preview, caption, upload progress. */
export const AttachmentDialog: React.FC<Props> = ({ roomId, file, replyTo, onClose, onSent }) => {
  const { t } = useTranslation();
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [preview] = useState(() => URL.createObjectURL(file));
  const isUploading = progress !== null;
  const dialogRef = useFocusTrap(true, () => {
    if (!isUploading) onClose();
  });
  const captionRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => URL.revokeObjectURL(preview), [preview]);
  useEffect(() => captionRef.current?.focus(), []);

  const send = async () => {
    setProgress(0);
    try {
      await messagesService.uploadAttachment(roomId, file, {
        caption: caption.trim() || undefined,
        replyToId: replyTo?.id,
        onProgress: setProgress,
      });
      onSent();
    } catch (error) {
      toast.error(getApiErrorMessage(error) || t('attachment.upload_error'));
      setProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attachment-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-pop"
      >
        <header className="flex items-center gap-2 px-4 py-3">
          <h2 id="attachment-title" className="flex-1 text-base font-semibold text-white">
            {t('attachment.send_photo')}
          </h2>
          <Button variant="icon" onClick={onClose} disabled={isUploading} aria-label={t('common.close', 'Close')}>
            <Icon name="close" />
          </Button>
        </header>

        <div className="bg-slate-900/60 flex items-center justify-center max-h-[50vh] overflow-hidden">
          <img src={preview} alt="" className="max-h-[50vh] w-auto object-contain" />
        </div>

        {replyTo && (
          <p className="px-4 pt-3 text-xs text-sky-400 truncate">
            {t('chat.reply_to', { name: nameOf(replyTo.user) })}
          </p>
        )}

        <form
          className="flex items-center gap-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isUploading) void send();
          }}
        >
          <input
            ref={captionRef}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={4000}
            disabled={isUploading}
            placeholder={t('attachment.caption_placeholder')}
            aria-label={t('attachment.caption_placeholder')}
            className="flex-1 min-h-11 bg-slate-900/80 border border-slate-700 rounded-xl px-4 text-[15px] text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Button type="submit" disabled={isUploading} className="min-h-11 px-5">
            {isUploading ? `${progress}%` : t('chat.send')}
          </Button>
        </form>

        {isUploading && (
          <div className="h-1 bg-slate-700" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-blue-500 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};
