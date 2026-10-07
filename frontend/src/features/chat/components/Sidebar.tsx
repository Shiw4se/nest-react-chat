import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUIStore } from '../../../store/useUIStore';
import { Avatar } from '../../../components/ui/Avatar';
import { nameOf } from '../../../utils/displayName';
import { useChatStore } from '../../../store/useChatStore';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CreateRoomModal } from './CreateRoomModal';
import { RoomListItem } from './RoomListItem';
import { useNow } from '../../../hooks/useNow';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const {
    myRooms,
    publicRooms,
    activeRoomId,
    isLoading,
    fetchMyRooms,
    fetchPublicRooms,
    setActiveRoom,
  } = useRoomStore();

  const currentUser = useAuthStore((state) => state.user);
  const username = currentUser?.username;
  const openProfile = useUIStore((state) => state.openProfile);
  const isConnected = useChatStore((state) => state.isConnected);
  const now = useNow(60_000);
  const totalUnread = myRooms.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0);
  const logout = useAuthStore((state) => state.clearAuth);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

  const [view, setView] = useState<'my' | 'public'>('my');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!username) return;
    if (view === 'my') {
      fetchMyRooms();
    } else {
      fetchPublicRooms();
    }
  }, [view, username, fetchMyRooms, fetchPublicRooms]);

  const currentRooms = view === 'my' ? myRooms : publicRooms;

  const sidebarDesktopClass = isSidebarOpen ? 'md:flex' : 'md:hidden';
  const sidebarClass = activeRoomId ? `hidden ${sidebarDesktopClass}` : 'flex';

  return (
    <>
      <aside
        className={`w-full md:w-80 flex-col h-dvh bg-slate-800 border-r border-slate-700/70 shrink-0 ${sidebarClass}`}
        aria-label={t('chat.sidebar_label', 'Chat sidebar')}
      >
        <div className="flex items-center gap-3 px-3 h-16 border-b border-slate-700/70 shrink-0">
          {currentUser && (
            <button
              type="button"
              onClick={() => openProfile(currentUser.id)}
              className="flex items-center gap-3 min-w-0 flex-1 -ml-1 pl-1 pr-2 py-1 rounded-xl text-left hover:bg-slate-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
              aria-label={t('profile.open_mine', 'Open my profile')}
              aria-haspopup="dialog"
            >
              <Avatar
                name={nameOf(currentUser)}
                seed={currentUser.username}
                src={currentUser.avatarUrl}
                online={isConnected}
                size="sm"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white truncate">
                  {nameOf(currentUser)}
                </span>
                <span
                  className={`block text-[11px] ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}
                >
                  {isConnected ? t('presence.online') : t('presence.connecting')}
                </span>
              </span>
            </button>
          )}
          <LanguageSwitcher />
          <Button
            variant="icon"
            onClick={logout}
            aria-label={t('common.logout', 'Log out')}
            title={t('common.logout', 'Log out')}
          >
            <Icon name="logout" size={18} />
          </Button>
        </div>

        <div id="tour-sidebar-tabs" className="p-3 shrink-0" role="tablist">
          <div className="flex bg-slate-900/70 p-1 rounded-xl border border-slate-700/60">
            {(['my', 'public'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={view === tab}
                onClick={() => setView(tab)}
                className={`flex-1 py-2 text-sm min-h-10 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 ${
                  view === tab
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'my' ? t('chat.my_chats') : t('chat.public')}
                {tab === 'my' && totalUnread > 0 && (
                  <span className="ml-1.5 inline-block min-w-5 px-1.5 rounded-full bg-blue-500 text-white text-[11px] font-bold leading-5 tabular-nums">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div
          id="tour-sidebar-rooms"
          className="flex-1 overflow-y-auto px-2 pb-2"
          role="tabpanel"
          aria-label={view === 'my' ? t('chat.my_chats') : t('chat.public')}
        >
          {isLoading && currentRooms.length === 0 ? (
            <div className="p-4 text-center text-slate-500 animate-pulse text-sm" role="status">
              {t('chat.loading')}
            </div>
          ) : currentRooms.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
              <Icon name="chat" size={36} className="opacity-30" />
              {view === 'my' ? t('chat.no_my_chats') : t('chat.no_public_rooms')}
            </div>
          ) : (
            currentRooms.map((room) => (
              <RoomListItem
                key={room.id}
                room={room}
                isActive={activeRoomId === room.id}
                variant={view === 'my' ? 'chat' : 'public'}
                currentUserId={currentUser?.id}
                now={now}
                onSelect={() => setActiveRoom(room.id)}
              />
            ))
          )}
        </div>

        <div id="tour-create-room" className="p-3 border-t border-slate-700/70 shrink-0 pb-safe">
          <Button className="w-full min-h-11" onClick={() => setIsModalOpen(true)}>
            <Icon name="plus" size={18} />
            {t('chat.create_join_room')}
          </Button>
        </div>
      </aside>

      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
