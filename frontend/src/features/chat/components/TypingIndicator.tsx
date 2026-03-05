import React from 'react';

interface Props {
  users: string[];
}

export const TypingIndicator: React.FC<Props> = ({ users }) => {
  if (users.length === 0) return null;
  return (
    <div className="absolute -top-6 left-4 text-xs text-slate-400 italic transition-opacity duration-300">
      {users.join(', ')} {users.length === 1 ? 'is' : 'are'} typing...
    </div>
  );
};
