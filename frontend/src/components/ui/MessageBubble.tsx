import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '../../types/chat';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { nameOf } from '../../utils/displayName';
import { groupReactions } from '../../utils/reactions';
import { ReactionPicker } from './ReactionPicker';
import { mediaUrl } from '../../utils/mediaUrl';

interface MessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  /** First message in a run from the same author: shows avatar and name */
  showMeta?: boolean;
  /** Briefly highlighted after jumping to it from a reply */
  highlighted?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onReply?: () => void;
  onAuthorClick?: () => void;
  /** Scroll to the quoted message */
  onQuoteClick?: (messageId: string) => void;
  onReact?: (emoji: string) => void;
  /** Open the attached image full screen */
  onImageClick?: (src: string) => void;
  currentUserId?: string;
}

const ActionButton: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  danger?: boolean;
  onClick: () => void;
}> = ({ icon, label, danger = false, onClick }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`p-1.5 rounded-full text-slate-400 hover:bg-slate-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 ${
      danger ? 'hover:text-red-400' : 'hover:text-white'
    }`}
  >
    <Icon name={icon} size={16} />
  </button>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  showMeta = true,
  highlighted = false,
  onDelete,
  onEdit,
  onReply,
  onAuthorClick,
  onQuoteClick,
  onReact,
  onImageClick,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const authorName = nameOf(message.user);
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const quote = message.replyTo;
  const reactionGroups = groupReactions(message.reactions, currentUserId);
  const imageSrc = mediaUrl(message.attachmentUrl);
  const hasCaption = message.message.length > 0;
  // Bubble width follows the image (up to 320px) so captions wrap under it
  const imageWidth = message.attachmentWidth ? Math.min(message.attachmentWidth, 320) : 320;

  const actions = (
    <div
      className={`flex items-center gap-0.5 self-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity ${
        isMe ? 'flex-row-reverse' : ''
      }`}
    >
      {onReact && <ReactionPicker onPick={onReact} align={isMe ? 'right' : 'left'} />}
      {onReply && <ActionButton icon="reply" label={t('chat.reply')} onClick={onReply} />}
      {onEdit && <ActionButton icon="edit" label={t('chat.edit')} onClick={onEdit} />}
      {onDelete && <ActionButton icon="trash" label={t('chat.delete')} danger onClick={onDelete} />}
    </div>
  );

  return (
    <div
      id={`msg-${message.id}`}
      className={`flex items-end gap-2 group rounded-xl transition-colors duration-700 ${
        isMe ? 'justify-end' : 'justify-start'
      } ${showMeta ? 'mt-3' : 'mt-0.5'} ${highlighted ? 'bg-sky-500/15' : ''}`}
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

      {isMe && actions}

      <div
        data-testid="message-bubble"
        onDoubleClick={onReply}
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

        {quote && (
          <button
            type="button"
            onClick={() => onQuoteClick?.(quote.id)}
            className={`block w-full text-left mb-1 rounded-md border-l-2 px-2 py-1 text-[13px] leading-snug ${
              isMe
                ? 'border-white/70 bg-white/10 hover:bg-white/15'
                : 'border-sky-400 bg-sky-400/10 hover:bg-sky-400/15'
            }`}
          >
            <span className={`block font-semibold text-xs ${isMe ? 'text-white' : 'text-sky-300'}`}>
              {nameOf(quote.user)}
            </span>
            <span className={`block truncate ${isMe ? 'text-blue-100' : 'text-slate-300'}`}>
              {quote.attachmentUrl ? `🖼 ${quote.message || t('attachment.photo')}` : quote.message}
            </span>
          </button>
        )}

        {(() => {
          const meta = (
            <span
              className={`text-[10px] flex gap-1 whitespace-nowrap ${
                isMe ? 'text-blue-200/80' : 'text-slate-400'
              }`}
            >
              {message.editedAt && <span>{t('chat.edited')}</span>}
              <time dateTime={message.createdAt}>{time}</time>
            </span>
          );
          const hasReactions = reactionGroups.length > 0;
          // Photo without caption or reactions: the time floats over the image
          const timeOverImage = !!imageSrc && !hasCaption && !hasReactions;
          return (
            <>
              {imageSrc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClick?.(imageSrc);
                  }}
                  aria-label={t('attachment.photo')}
                  className={`relative block -mx-2 overflow-hidden rounded-xl bg-black/20 ${hasCaption || hasReactions ? 'mb-1.5' : '-mb-0.5'}`}
                  style={{ width: imageWidth, maxWidth: 'calc(100% + 1rem)' }}
                >
                  <img
                    src={imageSrc}
                    alt=""
                    loading="lazy"
                    width={message.attachmentWidth ?? undefined}
                    height={message.attachmentHeight ?? undefined}
                    style={
                      message.attachmentWidth && message.attachmentHeight
                        ? { aspectRatio: `${message.attachmentWidth} / ${message.attachmentHeight}` }
                        : undefined
                    }
                    className="block w-full h-auto max-h-[420px] object-cover"
                  />
                  {timeOverImage && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5 [&_*]:text-white">
                      {meta}
                    </span>
                  )}
                </button>
              )}
              {(hasCaption || !imageSrc) && (
                <p className="text-[15px] leading-snug whitespace-pre-wrap" style={imageSrc ? { maxWidth: imageWidth } : undefined}>
                  {message.message}
                  {/* Reserve room for the time that floats in the last line */}
                  {!hasReactions && (
                    <span className={`inline-block ${message.editedAt ? 'w-20' : 'w-12'}`} aria-hidden="true" />
                  )}
                </p>
              )}
              {hasReactions ? (
                // With reactions the time sits at the end of the reaction row
                <div className="flex flex-wrap items-end gap-1 mt-1.5 mb-0.5" data-testid="reactions">
                  {reactionGroups.map((g) => (
                    <button
                      key={g.emoji}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReact?.(g.emoji);
                      }}
                      aria-pressed={g.mine}
                      aria-label={t('chat.reaction_label', { emoji: g.emoji, count: g.count })}
                      className={`inline-flex items-center gap-1 h-6 px-2 rounded-full text-xs font-semibold tabular-nums transition-colors ${
                        g.mine
                          ? isMe
                            ? 'bg-white text-blue-700'
                            : 'bg-sky-500 text-white'
                          : isMe
                            ? 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-slate-600/70 text-slate-100 hover:bg-slate-600'
                      }`}
                    >
                      <span className="text-sm leading-none">{g.emoji}</span>
                      {g.count}
                    </button>
                  ))}
                  <span className="ml-auto pl-2">{meta}</span>
                </div>
              ) : timeOverImage ? null : (
                <span className="absolute bottom-1 right-2.5">{meta}</span>
              )}
            </>
          );
        })()}
      </div>

      {!isMe && actions}
    </div>
  );
};
