import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUIStore } from '../../../store/useUIStore';
import { Button } from '../../../components/ui/Button';
import { CreateRoomModal } from './CreateRoomModal';

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

  const username = useAuthStore((state) => state.user?.username);
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
  }, [view, username]);

  const currentRooms = view === 'my' ? myRooms : publicRooms;

  const sidebarDesktopClass = isSidebarOpen ? 'md:flex' : 'md:hidden';
  const sidebarClass = activeRoomId
    ? `hidden ${sidebarDesktopClass}` 
    : 'flex'; 

  return (
    <>
      <aside 
        className={`w-full md:w-80 flex-col h-[100dvh] bg-slate-800 border-r border-slate-700 shrink-0 transition-all duration-300 ${sidebarClass}`}
        aria-label={t('chat.sidebar_label', 'Chat sidebar')}
      >
        <div id="tour-sidebar-tabs" className="p-4 border-b border-slate-700 flex gap-2" role="tablist">
          <button
            role="tab"
            aria-selected={view === 'my'}
            onClick={() => setView('my')}
            className={`flex-1 py-2 text-sm min-h-[44px] rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              view === 'my' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {t('chat.my_chats')}
          </button>
          
          <button
            role="tab"
            aria-selected={view === 'public'}
            onClick={() => setView('public')}
            className={`flex-1 py-2 text-sm min-h-[44px] rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              view === 'public' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {t('chat.public')}
          </button>
        </div>

        <div 
          id="tour-sidebar-rooms" 
          className="flex-1 overflow-y-auto"
          role="tabpanel"
          aria-label={view === 'my' ? t('chat.my_chats') : t('chat.public')}
        >
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 animate-pulse text-sm" role="status">
              {t('chat.loading')}
            </div>
          ) : currentRooms.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              {view === 'my' ? t('chat.no_my_chats') : t('chat.no_public_rooms')}
            </div>
          ) : (
            currentRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                aria-current={activeRoomId === room.id ? 'true' : 'false'}
                className={`w-full text-left p-4 cursor-pointer transition-all border-b border-slate-700/50 hover:bg-slate-700 flex flex-col gap-1 focus:outline-none focus:bg-slate-700 focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                  activeRoomId === room.id
                    ? 'bg-slate-700 border-l-4 border-l-blue-500'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="font-bold text-slate-200 truncate">{room.name}</div>
                <div className="text-xs text-slate-400 flex justify-between items-center w-full mt-1">
                  <span>
                    {room.type === 'PUBLIC' ? t('chat.room_public') : t('chat.room_private')}
                  </span>
                  <span>
                    {room._count?.members || 0} {t('chat.members')}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div id="tour-create-room" className="p-4 border-t border-slate-700 bg-slate-900/50 shrink-0 pb-safe">
          <Button className="w-full min-h-[44px] focus:ring-2 focus:ring-blue-500" onClick={() => setIsModalOpen(true)}>
            {t('chat.create_join_room')}
          </Button>
        </div>
      </aside>

      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};