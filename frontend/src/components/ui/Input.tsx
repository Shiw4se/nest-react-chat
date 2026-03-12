import React, { useRef, useEffect } from 'react';

type BaseProps = {
  onEnterPress?: () => void;
};

type StandardInputProps = BaseProps & {
  multiline?: false;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof BaseProps>;

type TextareaProps = BaseProps & {
  multiline: true;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseProps>;

export type PolymorphicInputProps = StandardInputProps | TextareaProps;

export const Input: React.FC<PolymorphicInputProps> = (props) => {
  const { onEnterPress, className = '', value } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!props.multiline || !textarea) return;
    textarea.style.height = '0px';
    const scrollHeight = textarea.scrollHeight;
    const MAX_HEIGHT = 120;
    textarea.style.height = `${Math.min(scrollHeight, MAX_HEIGHT)}px`;
  }, [value, props.multiline]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (props.multiline && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onEnterPress) onEnterPress();
    }
    if (props.onKeyDown) props.onKeyDown(e as any);
  };

  const baseClasses = `
    w-full px-4 py-3
    bg-slate-900
    border border-slate-600
    rounded-xl
    outline-none
    text-white placeholder:text-slate-500
    transition-all duration-150
    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30
    break-words
    ${className}
  `.replace(/\s+/g, ' ').trim();

  if (props.multiline) {
    const { multiline, onEnterPress, ...textareaProps } = props;
    return (
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        rows={1}
        className={`resize-none overflow-y-auto min-h-[48px] max-h-[120px] ${baseClasses}`}
        {...(textareaProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  const { multiline, onEnterPress: _, ...inputProps } = props;
  return (
    <input
      className={`h-[48px] ${baseClasses}`}
      {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  );
};