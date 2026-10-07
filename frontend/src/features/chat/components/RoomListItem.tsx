import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../../components/ui/Avatar';
import { Icon } from '../../../components/ui/Icon';
import { nameOf } from '../../../utils/displayName';
import { formatListTime } from '../../../utils/chatTime';
import type { Room } from '../../../types/room';

interface Props {
  room: Room;
  isActive: boolean;
  /** "My chats" rows show the last message and unread badge; public rows show member counts */
  variant: 'chat' | 'public';
  currentUserId?: string;
  now: number;
  onSelect: () => void;
}

export const RoomListItem: React.FC<Props> = ({
  room,
  isActive,
  variant,
  currentUserId,
  now,
  onSelect,
}) => {
  const { t, i18n } = useTranslation();
  const last = room.lastMessage;
  const unread = room.unreadCount ?? 0;
  const muted = isActive ? 'text-blue-100/80' : 'text-slate-400';

  const sender = last
    ? last.userId === currentUserId
      ? t('chat.you')
      : nameOf(last.user)
    : '';
  const preview = last?.message.replace(/\s+/g, ' ').trim() ?? '';

  return (
    <button
      onClick={onSelect}
      aria-current={isActive ? 'true' : 'false'}
      aria-label={unread > 0 ? `${room.name}, ${t('chat.unread_count', { count: unread })}` : room.name}
      className={`w-full text-left px-2.5 py-2.5 rounded-xl flex items-center gap-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/70 ${
        isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-700/60 text-slate-200'
      }`}
    >
      <Avatar name={room.name} size="md" shape="rounded" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold truncate text-[15px] flex-1 flex items-center gap-1.5">
            {room.type === 'PRIVATE' && <Icon name="lock" size={12} className={muted} />}
            <span className="truncate">{room.name}</span>
          </span>
          {variant === 'chat' && last && (
            <time dateTime={last.createdAt} className={`text-[11px] shrink-0 ${muted}`}>
              {formatListTime(last.createdAt, now, i18n.language)}
            </time>
          )}
        </div>

        <div className={`text-[13px] flex items-center gap-2 mt-0.5 ${muted}`}>
          {variant === 'chat' ? (
            <>
              <span className="truncate flex-1">
                {last ? (
                  <>
                    <span className={isActive ? 'text-white' : 'text-slate-300'}>{sender}: </span>
                    {preview}
                  </>
                ) : (
                  <span className="italic">{t('chat.no_messages_short')}</span>
                )}
              </span>
              {unread > 0 && !isActive && (
                <span
                  className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-bold leading-5 text-center tabular-nums"
                  aria-hidden="true"
                >
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <Icon name={room.type === 'PUBLIC' ? 'globe' : 'lock'} size={12} />
              {t('room.members_count', { count: room._count?.members ?? 0 })}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
