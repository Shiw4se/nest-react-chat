import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useRoomStore } from '../store/useRoomStore';
import { useChatSocket } from './useChatSocket';
import { useChatHistory } from './useChatHistory';
import { WebSocketManager } from '../websockets/services/WebSocketManager';
import { MessageBuilder } from '../websockets/builders/MessageBuilder';
import { MessageValidationChain } from '../websockets/strategies/MessageValidator';


export const useChatFacade = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);

  const { messages, typingUsers, clearMessages } = useChatStore();
  const { activeRoomId, myRooms, publicRooms, setActiveRoom } = useRoomStore();

  const { sendMessage: socketSend, handleTyping, deleteMessage } = useChatSocket(user, activeRoomId);
  const { loadMore, isLoadingMore } = useChatHistory(activeRoomId);

  const validator = useMemo(() => new MessageValidationChain(), []);

  const currentRoom = useMemo(
    () => [...myRooms, ...publicRooms].find((r) => r.id === activeRoomId),
    [myRooms, publicRooms, activeRoomId],
  );

  const switchRoom = useCallback(
    (roomId: string) => {
      clearMessages();
      setActiveRoom(roomId);
    },
    [clearMessages, setActiveRoom],
  );

  const sendMessage = useCallback(
    (text: string): { success: boolean; error?: string } => {
      if (!activeRoomId) return { success: false, error: 'No room selected' };
      try {
        validator.validate(text);
        const chunks = text.match(/[\s\S]{1,2000}/gu) ?? [];
        chunks.forEach((chunk) => {
          const payload = new MessageBuilder().setRoom(activeRoomId).setMessage(chunk).build();
          socketSend(payload);
        });
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid message';
        return { success: false, error: message };
      }
    },
    [activeRoomId, socketSend, validator],
  );

  const leaveChat = useCallback(() => {
    WebSocketManager.getInstance().disconnect();
    clearMessages();
    logout();
  }, [clearMessages, logout]);

  return {
    user,
    messages,
    typingUsers,
    activeRoomId,
    currentRoom,
    isLoadingMore,

    switchRoom,
    sendMessage,
    leaveChat,
    handleTyping,
    deleteMessage,
    loadMore,
  };
};