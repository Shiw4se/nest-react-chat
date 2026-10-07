import React from 'react';

interface Props {
  users: string[];
}

export const TypingIndicator: React.FC<Props> = ({ users }) => {
  if (users.length === 0) return null;
  return (
    <div
      className="absolute -top-7 left-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700/60"
      role="status"
      aria-live="polite"
    >
      <span className="flex gap-0.5" aria-hidden="true">
        <span className="typing-dot" />
        <span className="typing-dot [animation-delay:150ms]" />
        <span className="typing-dot [animation-delay:300ms]" />
      </span>
      <span>
        {users.join(', ')} {users.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  );
};
