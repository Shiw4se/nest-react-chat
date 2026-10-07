import React from 'react';
import type { ChatMessage } from '../../types/chat';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { nameOf } from '../../utils/displayName';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  /** First message in a run from the same author: shows avatar and name */
  showMeta?: boolean;
  onDelete?: () => void;
  onAuthorClick?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  showMeta = true,
  onDelete,
  onAuthorClick,
}) => {
  const authorName = nameOf(message.user);
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'} ${
        showMeta ? 'mt-3' : 'mt-0.5'
      }`}
    >
      {!isMe && (
        <div className="w-8 shrink-0">
          {showMeta && (
            <button
              type="button"
              onClick={onAuthorClick}
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
              aria-label={authorName}
              tabIndex={-1}
            >
              <Avatar
                name={authorName}
                seed={message.user.username}
                src={message.user.avatarUrl}
                size="xs"
              />
            </button>
          )}
        </div>
      )}

      {isMe && onDelete && (
        <button
          type="button"
          title="Delete message"
          aria-label="Delete message"
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-slate-500 hover:text-red-400 p-1.5 rounded-full hover:bg-slate-800"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
        >
          <Icon name="trash" size={16} />
        </button>
      )}

      <div
        data-testid="message-bubble"
        className={`relative px-3.5 py-2 max-w-[78%] sm:max-w-md break-words shadow-sm ${
          isMe
            ? `bg-blue-600 text-white rounded-2xl ${showMeta ? 'rounded-br-md' : ''}`
            : `bg-slate-700 text-slate-100 rounded-2xl ${showMeta ? 'rounded-bl-md' : ''}`
        }`}
      >
        {!isMe && showMeta && (
          <button
            type="button"
            onClick={onAuthorClick}
            className="text-xs text-sky-300 font-semibold block mb-0.5 hover:underline focus:outline-none focus-visible:underline"
          >
            {authorName}
          </button>
        )}
        <p className="text-[15px] leading-snug whitespace-pre-wrap">
          {message.message}
          <span className="inline-block w-12" aria-hidden="true" />
        </p>
        <time
          dateTime={message.createdAt}
          className={`absolute bottom-1 right-2.5 text-[10px] ${
            isMe ? 'text-blue-200/80' : 'text-slate-400'
          }`}
        >
          {time}
        </time>
      </div>
    </div>
  );
};
