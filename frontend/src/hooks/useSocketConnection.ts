import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { usePresenceStore } from '../store/usePresenceStore';
import { useRoomStore } from '../store/useRoomStore';
import type { MessagePreview } from '../types/room';
import { WebSocketManager } from '../websockets/services/WebSocketManager';
import i18n from '../config/i18n';

interface RoomActivityEvent {
  roomId: string;
  /** null for edits/deletions that only refresh the preview */
  senderId: string | null;
  lastMessage: MessagePreview | null;
}

interface PresenceEvent {
  userId: string;
  online: boolean;
  lastSeenAt?: string;
}

/**
 * Owns the socket for the whole logged-in session: connects after login,
 * tracks connection status and handles app-wide events (errors, presence).
 * Room-specific events live in useChatSocket.
 */
export const useSocketConnection = () => {
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;

    const manager = WebSocketManager.getInstance();
    const socket = manager.socket;
    const chat = useChatStore.getState();
    const presence = usePresenceStore.getState();

    const onConnect = () => {
      chat.setIsConnected(true);
      chat.setIsReconnecting(false);
    };
    const onDisconnect = () => {
      chat.setIsConnected(false);
      presence.reset();
    };
    const onConnectError = () => {
      chat.setIsConnected(false);
      chat.setIsReconnecting(true);
    };
    const onServerError = (data: { message?: string } | string) => {
      const message = typeof data === 'string' ? data : data?.message;
      toast.error(message || i18n.t('chat.server_error'));
    };
    const onSnapshot = ({ online }: { online: string[] }) => presence.setSnapshot(online);
    const onPresence = ({ userId: id, online, lastSeenAt }: PresenceEvent) =>
      presence.setPresence(id, online, lastSeenAt);

    const onRoomActivity = ({ roomId, senderId, lastMessage }: RoomActivityEvent) => {
      const rooms = useRoomStore.getState();
      const isOwn = senderId === userId;
      const isViewing = rooms.activeRoomId === roomId && document.visibilityState === 'visible';
      const isNewFromOthers = !!senderId && !isOwn;

      if (isNewFromOthers && isViewing) socket.emit(SOCKET_EVENTS.MARK_READ, { roomId });
      rooms.applyActivity(roomId, lastMessage, isNewFromOthers && !isViewing);
    };

    socket.on(SOCKET_EVENTS.CONNECT, onConnect);
    socket.on(SOCKET_EVENTS.ROOM_ACTIVITY, onRoomActivity);
    socket.on(SOCKET_EVENTS.DISCONNECT, onDisconnect);
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
    socket.on(SOCKET_EVENTS.ERROR, onServerError);
    socket.on(SOCKET_EVENTS.EXCEPTION, onServerError);
    socket.on(SOCKET_EVENTS.PRESENCE_SNAPSHOT, onSnapshot);
    socket.on(SOCKET_EVENTS.PRESENCE, onPresence);

    manager.connectWithToken(useAuthStore.getState().token);
    if (socket.connected) onConnect();

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, onConnect);
      socket.off(SOCKET_EVENTS.ROOM_ACTIVITY, onRoomActivity);
      socket.off(SOCKET_EVENTS.DISCONNECT, onDisconnect);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, onConnectError);
      socket.off(SOCKET_EVENTS.ERROR, onServerError);
      socket.off(SOCKET_EVENTS.EXCEPTION, onServerError);
      socket.off(SOCKET_EVENTS.PRESENCE_SNAPSHOT, onSnapshot);
      socket.off(SOCKET_EVENTS.PRESENCE, onPresence);
    };
  }, [userId]);
};
