import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
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

  return (
    <>
      <aside className="w-80 flex flex-col h-screen bg-slate-800 border-r border-slate-700 shrink-0">
        <div id="tour-sidebar-tabs" className="p-4 border-b border-slate-700 flex gap-2">
          <Button
            variant={view === 'my' ? 'primary' : 'text'}
            onClick={() => setView('my')}
            className="flex-1 py-2 text-sm"
          >
            {t('chat.my_chats')}
          </Button>
          <Button
            variant={view === 'public' ? 'primary' : 'text'}
            onClick={() => setView('public')}
            className="flex-1 py-2 text-sm"
          >
            {t('chat.public')}
          </Button>
        </div>

        <div id="tour-sidebar-rooms" className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 animate-pulse text-sm">
              {t('chat.loading')}
            </div>
          ) : currentRooms.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              {view === 'my' ? t('chat.no_my_chats') : t('chat.no_public_rooms')}
            </div>
          ) : (
            currentRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`p-4 cursor-pointer transition-colors border-b border-slate-700/50 hover:bg-slate-700 flex flex-col gap-1 ${
                  activeRoomId === room.id
                    ? 'bg-slate-700 border-l-4 border-l-blue-500'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="font-bold text-slate-200 truncate">{room.name}</div>
                <div className="text-xs text-slate-400 flex justify-between items-center">
                  <span>{room.type === 'PUBLIC' ? t('chat.room_public') : t('chat.room_private')}</span>
                  <span>{room._count?.members || 0} {t('chat.members')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div id="tour-create-room" className="p-4 border-t border-slate-700 bg-slate-900/50">
          <Button className="w-full" onClick={() => setIsModalOpen(true)}>
            {t('chat.create_join_room')}
          </Button>
        </div>
      </aside>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};