import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { useChatStore } from '../../../store/useChatStore';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUIStore } from '../../../store/useUIStore';
import { InviteModal } from './InviteModal';
import { RoomInfoPanel } from './RoomInfoPanel';
import type { Room } from '../../../types/room';

interface Props {
  room: Room | undefined;
}

export const ChatHeader: React.FC<Props> = ({ room }) => {
  const { t } = useTranslation();
  const isConnected = useChatStore((s) => s.isConnected);
  const isReconnecting = useChatStore((s) => s.isReconnecting);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const setActiveRoom = useRoomStore((s) => s.setActiveRoom);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = !!room && room.ownerId === currentUserId;
  const canInvite = isOwner && room?.type === 'PRIVATE';

  useEffect(() => {
    if (!isMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);

  const subtitle = useMemo(() => {
    if (!room) return '';
    if (!isConnected) {
      return isReconnecting ? t('chat.reconnecting') : t('chat.disconnected');
    }
    if (typingUsers.length > 0) {
      return typingUsers.length === 1
        ? t('chat.typing_one', { name: typingUsers[0] })
        : t('chat.typing_many', { names: typingUsers.join(', ') });
    }
    return t('room.members_count', { count: room._count?.members ?? 0 });
  }, [room, isConnected, isReconnecting, typingUsers, t]);

  const subtitleTone = !isConnected
    ? isReconnecting
      ? 'text-amber-400'
      : 'text-red-400'
    : typingUsers.length > 0
      ? 'text-sky-400'
      : 'text-slate-400';

  return (
    <>
      <header className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 h-16 bg-slate-800/95 backdrop-blur border-b border-slate-700/70 z-20 shrink-0">
        <Button
          variant="icon"
          onClick={() => setActiveRoom(null)}
          className="md:hidden"
          aria-label={t('common.back', 'Back to rooms')}
        >
          <Icon name="back" />
        </Button>

        <Button
          variant="icon"
          onClick={toggleSidebar}
          className="hidden md:inline-flex"
          aria-label={t('common.toggle_sidebar', 'Toggle sidebar')}
        >
          <Icon name="menu" />
        </Button>

        {room ? (
          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center gap-3 min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
            aria-haspopup="dialog"
            aria-label={t('room.open_info', 'Open room info')}
          >
            <span className="relative">
              <Avatar name={room.name} size="md" shape="rounded" />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-800 ${
                  isConnected ? 'bg-emerald-500' : isReconnecting ? 'bg-amber-400' : 'bg-red-500'
                }`}
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold text-slate-50 leading-tight truncate">
                {room.name}
              </span>
              <span className={`block text-xs leading-tight truncate ${subtitleTone}`}>
                {subtitle}
              </span>
            </span>
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {room && (
          <div className="relative" ref={menuRef}>
            <Button
              variant="icon"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label={t('room.menu', 'Room menu')}
            >
              <Icon name="more" />
            </Button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 animate-pop z-30"
              >
                <MenuItem
                  icon="info"
                  label={t('room.info', 'Room info')}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsInfoOpen(true);
                  }}
                />
                {canInvite && (
                  <MenuItem
                    icon="link"
                    label={t('room.invite', 'Invite')}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsInviteOpen(true);
                    }}
                  />
                )}
                <div className="my-1 border-t border-slate-700/70" />
                <MenuItem
                  icon={isOwner ? 'trash' : 'logout'}
                  label={isOwner ? t('room.delete') : t('room.leave')}
                  danger
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsInfoOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </header>

      {room && (
        <>
          <RoomInfoPanel
            isOpen={isInfoOpen}
            roomId={room.id}
            onClose={() => setIsInfoOpen(false)}
            onInvite={() => setIsInviteOpen(true)}
          />
          <InviteModal
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
            roomId={room.id}
          />
        </>
      )}
    </>
  );
};

const MenuItem: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  danger?: boolean;
  onClick: () => void;
}> = ({ icon, label, danger = false, onClick }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-left transition-colors focus:outline-none focus-visible:bg-slate-700/60 ${
      danger
        ? 'text-red-400 hover:bg-red-500/10'
        : 'text-slate-200 hover:bg-slate-700/60'
    }`}
  >
    <Icon name={icon} size={18} />
    {label}
  </button>
);
