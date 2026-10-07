import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/ui/Icon';

export const BIO_MAX = 160;

interface Props {
  value: string | null;
  /** Resolves true when saved; on false the editor stays open with the draft. */
  onSave: (bio: string) => Promise<boolean>;
}

/**
 * Telegram-style "About" row: click it and type straight away.
 * Enter or clicking away saves, Shift+Enter adds a line break, Esc cancels.
 */
export const InlineBio: React.FC<Props> = ({ value, onSave }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Guards against a second save from the blur that follows Enter / Esc
  const closingRef = useRef(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!isEditing || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing]);

  // Grow with the text, like the message input
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, isEditing]);

  const start = () => {
    closingRef.current = false;
    setDraft(value ?? '');
    setIsEditing(true);
  };

  const cancel = () => {
    closingRef.current = true;
    setIsEditing(false);
  };

  const commit = async () => {
    if (closingRef.current) return;
    closingRef.current = true;

    if (draft.trim() === (value ?? '').trim()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const ok = await onSave(draft);
    setIsSaving(false);
    if (ok) {
      setIsEditing(false);
    } else {
      closingRef.current = false;
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void commit();
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-4 px-5 py-3 bg-slate-700/30">
        <Icon name="info" size={20} className="text-sky-400 mt-0.5" />
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => void commit()}
            maxLength={BIO_MAX}
            rows={1}
            disabled={isSaving}
            placeholder={t('profile.bio_placeholder')}
            aria-label={t('profile.bio')}
            // Esc cancels this edit instead of closing the whole panel
            data-own-escape
            className="block w-full resize-none overflow-hidden bg-transparent text-[15px] leading-snug text-slate-100 placeholder:text-slate-500 outline-none border-b-2 border-sky-500 pb-1 disabled:opacity-60"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>{isSaving ? t('profile.saving') : t('profile.bio_inline_hint')}</span>
            <span className="tabular-nums">
              {draft.length}/{BIO_MAX}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="group w-full flex gap-4 px-5 py-3 text-left hover:bg-slate-700/40 transition-colors focus:outline-none focus-visible:bg-slate-700/60"
      aria-label={`${t('profile.bio')}: ${value ?? t('profile.bio_empty_me')}`}
    >
      <Icon name="info" size={20} className="text-slate-500 mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px]">
          {value ? (
            <span className="text-slate-100 whitespace-pre-wrap break-words">{value}</span>
          ) : (
            <span className="text-slate-500 italic">{t('profile.bio_empty_me')}</span>
          )}
        </span>
        <span className="block text-xs text-slate-500 mt-0.5">{t('profile.bio')}</span>
      </span>
      <Icon
        name="edit"
        size={16}
        className="text-slate-500 mt-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
      />
    </button>
  );
};
