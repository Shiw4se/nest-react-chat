import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { QUICK_REACTIONS } from '../../utils/reactions';

interface Props {
  onPick: (emoji: string) => void;
  /** Open the popover towards the bubble */
  align: 'left' | 'right';
}

/** Smiley button that opens a row of quick reactions. */
export const ReactionPicker: React.FC<Props> = ({ onPick, align }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={t('chat.react')}
        aria-label={t('chat.react')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
      >
        <Icon name="smile" size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute bottom-full mb-1 z-20 flex gap-0.5 bg-slate-800 border border-slate-700 rounded-full shadow-2xl px-1.5 py-1 animate-pop ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="menuitem"
              aria-label={emoji}
              onClick={(e) => {
                e.stopPropagation();
                onPick(emoji);
                setOpen(false);
              }}
              className="h-9 w-9 rounded-full text-xl leading-none hover:bg-slate-700 hover:scale-125 transition-transform focus:outline-none focus-visible:bg-slate-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
