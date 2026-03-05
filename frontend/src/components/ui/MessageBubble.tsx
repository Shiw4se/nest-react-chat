import React from 'react';
import type { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe }) => {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <span className="text-xs text-slate-400 mb-1 ml-1">{message.user.username}</span>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isMe
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-slate-700 text-slate-100 rounded-tl-sm'
        }`}
      >
        {message.message}
      </div>
    </div>
  );
};
