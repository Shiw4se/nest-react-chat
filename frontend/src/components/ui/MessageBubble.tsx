import React from 'react';
import type { ChatMessage } from '../../types/chat';
import { Button } from './Button';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  onDelete?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, onDelete }) => {
  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4 group`}>
      <div className="flex items-end gap-2">
        {isMe && onDelete && (
          <Button
            variant="text"
            type="button"
            title="Delete message"
            className="opacity-0 group-hover:opacity-100 transition-opacity !no-underline p-2 z-10 cursor-pointer text-base hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            🗑️
          </Button>
        )}

        <div
          data-testid="message-bubble"
          className={`px-4 py-2 rounded-2xl max-w-sm break-words relative z-0 ${
            isMe
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-700 text-slate-200 rounded-bl-none'
          }`}
        >
          {!isMe && (
            <span className="text-xs text-blue-300 font-semibold block mb-1">
              {message.user.username}
            </span>
          )}
          <p className="text-sm">{message.message}</p>
        </div>
      </div>
      <span className="text-[10px] text-slate-500 mt-1">
        {new Date(message.createdAt ?? Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};
