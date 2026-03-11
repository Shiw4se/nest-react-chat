import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { useChatStore } from '../../../store/useChatStore';
import { useRoomStore } from '../../../store/useRoomStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { SUPPORTED_LANGUAGES } from '../../../constants/languages';
import { InviteModal } from './InviteModal';

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

  const activeRoomId = useRoomStore((state) => state.activeRoomId);
  const myRooms = useRoomStore((state) => state.myRooms);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const activeRoom = useMemo(
    () => myRooms.find((r) => r.id === activeRoomId),
    [myRooms, activeRoomId]
  );

  const canInvite = activeRoom?.type === 'PRIVATE' && activeRoom?.ownerId === currentUserId;

  console.log({ activeRoom, currentUserId, canInvite });

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
      <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {isReconnecting && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${statusColor}`}></span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{t('chat.title')}</h2>
            <p className="text-xs text-slate-400">
              {t('chat.room')}: <span className="text-blue-400">{room}</span> |{statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Button
                key={lang}
                variant="text"
                onClick={() => i18n.changeLanguage(lang)}
                className={`uppercase px-2 py-1 rounded-md text-[10px] font-bold transition-all !no-underline ${i18n.language === lang
                  ? '!bg-blue-600 !text-white'
                  : '!text-slate-500 hover:!text-slate-300'
                  }`}
              >
                {lang}
              </Button>
            ))}
          </div>

          {canInvite && (
            <Button
              onClick={() => setIsInviteOpen(true)}
              variant="text"
              className="text-xs px-3 py-1.5 border border-slate-600 hover:border-blue-500"
            >
              📋 {t('invite.btn', 'Invite')}
            </Button>
          )}

          <Button onClick={onLeave} variant="danger" className="text-xs px-3 py-1.5">
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