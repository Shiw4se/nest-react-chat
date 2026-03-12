import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { useChatStore } from '../../../store/useChatStore';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { SUPPORTED_LANGUAGES } from '../../../constants/languages';
import { InviteModal } from './InviteModal';
import { useUIStore } from '../../../store/useUIStore';

interface Props {
  room: string;
  username: string;
  onLeave: () => void;
}

export const ChatHeader: React.FC<Props> = ({ room, username, onLeave }) => {
  const { t, i18n } = useTranslation();
  const isConnected = useChatStore((state) => state.isConnected);
  const isReconnecting = useChatStore((state) => state.isReconnecting);

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { activeRoomId, myRooms, setActiveRoom } = useRoomStore();
  const { toggleSidebar } = useUIStore();
  
  const currentUserId = useAuthStore((state) => state.user?.id);

  const activeRoom = useMemo(
    () => myRooms.find((r) => r.id === activeRoomId),
    [myRooms, activeRoomId],
  );

  const canInvite = activeRoom?.type === 'PRIVATE' && activeRoom?.ownerId === currentUserId;

  const statusColor = useMemo(() => {
    if (isConnected) return 'bg-green-500';
    if (isReconnecting) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [isConnected, isReconnecting]);

  const statusText = useMemo(() => {
    if (isConnected) return ` ${t('chat.connected_as')} ${username}`;
    if (isReconnecting) return ` ${t('chat.reconnecting')}`;
    return ` ${t('chat.disconnected')}`;
  }, [isConnected, isReconnecting, t, username]);

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-slate-800 border-b border-slate-700 shadow-sm z-10 gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          
          <Button
            variant="text"
            onClick={() => setActiveRoom(null)}
            className="md:hidden px-2 py-1 text-slate-400 hover:text-white min-h-[44px] focus:ring-2 focus:ring-blue-500 shrink-0"
            aria-label={t('common.back', 'Back to rooms')}
          >
            <span className="text-xl">←</span>
          </Button>

          <Button
            variant="text"
            onClick={toggleSidebar}
            className="hidden md:flex px-2 py-1 text-slate-400 hover:text-white min-h-[44px] focus:ring-2 focus:ring-blue-500 shrink-0"
            aria-label={t('common.toggle_sidebar', 'Toggle sidebar')}
            title="Toggle Sidebar"
          >
            <span className="text-xl">☰</span>
          </Button>

          <div className="relative flex h-3 w-3 shrink-0">
            {isReconnecting && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${statusColor}`}></span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{t('chat.title')}</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">
              {t('chat.room')}: <span className="text-blue-400">{room}</span> |{statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 shrink-0">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Button
                key={lang}
                variant="text"
                onClick={() => i18n.changeLanguage(lang)}
                className={`uppercase px-2 py-1 rounded-md text-[10px] font-bold transition-all min-h-[32px] !no-underline focus:ring-2 focus:ring-blue-500 ${
                  i18n.language === lang
                    ? '!bg-blue-600 !text-white'
                    : '!text-slate-500 hover:!text-slate-300'
                }`}
                aria-pressed={i18n.language === lang}
                aria-label={`Change language to ${lang}`}
              >
                {lang}
              </Button>
            ))}
          </div>

          {canInvite && (
            <Button
              onClick={() => setIsInviteOpen(true)}
              variant="text"
              className="text-xs px-3 py-1.5 border border-slate-600 hover:border-blue-500 min-h-[44px] shrink-0 focus:ring-2 focus:ring-blue-500"
              aria-haspopup="dialog"
            >
              📋 {t('invite.btn', 'Invite')}
            </Button>
          )}

          <Button 
            onClick={onLeave} 
            variant="danger" 
            className="text-xs px-3 py-1.5 min-h-[44px] shrink-0 focus:ring-2 focus:ring-red-500"
          >
            {t('chat.leave')}
          </Button>
        </div>
      </header>

      {activeRoomId && (
        <InviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          roomId={activeRoomId}
        />
      )}
    </>
  );
};