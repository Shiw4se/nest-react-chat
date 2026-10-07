import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { nameOf } from '../../../utils/displayName';
import type { ChatMessage } from '../../../types/chat';
import { firstImage, IMAGE_TYPES } from '../../../utils/imageFile';

export type ComposerMode =
  | { type: 'reply'; message: ChatMessage }
  | { type: 'edit'; message: ChatMessage }
  | null;

interface Props {
  mode: ComposerMode;
  onSend: (text: string) => boolean;
  onSaveEdit: (message: ChatMessage, text: string) => boolean;
  onCancelMode: () => void;
  /** ↑ in an empty field edits the user's last message, like Telegram */
  onEditLast: () => void;
  onTyping: () => void;
  /** An image was chosen, pasted or dropped */
  onPickFile?: (file: File) => void;
}

const MAX_HEIGHT = 140;

export const Composer: React.FC<Props> = ({
  mode,
  onSend,
  onSaveEdit,
  onCancelMode,
  onEditLast,
  onTyping,
  onPickFile,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Entering edit mode loads the original text; any mode change focuses the field
  const modeKey = mode ? `${mode.type}:${mode.message.id}` : '';
  const prevTypeRef = useRef<'reply' | 'edit' | null>(null);
  useEffect(() => {
    const prevType = prevTypeRef.current;
    prevTypeRef.current = mode?.type ?? null;
    if (!mode) return;
    if (mode.type === 'edit') setText(mode.message.message);
    // Leaving edit mode for a reply must not keep the edited text as a draft
    else if (prevType === 'edit') setText('');
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  const cancel = () => {
    if (mode?.type === 'edit') setText('');
    onCancelMode();
  };

  const submit = () => {
    const value = text.trim();
    const isPhotoEdit = mode?.type === 'edit' && !!mode.message.attachmentUrl;
    if (!value && !isPhotoEdit) return;
    const ok = mode?.type === 'edit' ? onSaveEdit(mode.message, value) : onSend(value);
    if (ok) setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape' && mode) {
      e.preventDefault();
      cancel();
    } else if (e.key === 'ArrowUp' && !text && !mode) {
      e.preventDefault();
      onEditLast();
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-safe">
      {mode && (
        <div className="flex items-center gap-3 mb-2 px-1 animate-pop" data-testid="composer-mode">
          <Icon
            name={mode.type === 'edit' ? 'edit' : 'reply'}
            size={20}
            className="text-sky-400 shrink-0"
          />
          <div className="min-w-0 flex-1 border-l-2 border-sky-400 pl-2.5">
            <p className="text-xs font-semibold text-sky-400">
              {mode.type === 'edit'
                ? t('chat.editing')
                : t('chat.reply_to', { name: nameOf(mode.message.user) })}
            </p>
            <p className="text-[13px] text-slate-400 truncate">{mode.message.message}</p>
          </div>
          <Button variant="icon" onClick={cancel} aria-label={t('common.cancel', 'Cancel')} className="h-8! w-8!">
            <Icon name="close" size={18} />
          </Button>
        </div>
      )}

      <div id="tour-input" className="flex gap-2 items-end">
        {onPickFile && mode?.type !== 'edit' && (
          <>
            <Button
              variant="icon"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t('attachment.attach')}
              title={t('attachment.attach')}
              className="h-11! w-11! shrink-0"
            >
              <Icon name="paperclip" size={20} />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_TYPES.join(',')}
              className="hidden"
              data-testid="attach-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onPickFile(file);
              }}
            />
          </>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            const image = firstImage(e.clipboardData?.files);
            if (image && onPickFile) {
              e.preventDefault();
              onPickFile(image);
            }
          }}
          placeholder={t('chat.placeholder')}
          aria-label={t('chat.message_input_label', 'Type a message')}
          className="flex-1 min-h-11 resize-none overflow-y-auto text-[15px] leading-snug bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl px-4 py-2.5 transition-colors"
        />
        <Button
          onClick={submit}
          disabled={!text.trim() && !(mode?.type === 'edit' && mode.message.attachmentUrl)}
          className="h-11.5 w-11.5 p-0! rounded-full shrink-0"
          aria-label={mode?.type === 'edit' ? t('chat.save_edit') : t('chat.send_button', 'Send message')}
          title={mode?.type === 'edit' ? t('chat.save_edit') : t('chat.send')}
        >
          <Icon name={mode?.type === 'edit' ? 'check' : 'send'} size={20} className={mode?.type === 'edit' ? '' : '-ml-0.5'} />
        </Button>
      </div>
    </div>
  );
};
