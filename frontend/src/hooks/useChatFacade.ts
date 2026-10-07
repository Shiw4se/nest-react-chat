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

  const {
    sendMessage: socketSend,
    handleTyping,
    deleteMessage,
    editMessage: socketEdit,
  } = useChatSocket(user, activeRoomId);
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
    (text: string, replyToId?: string): { success: boolean; error?: string } => {
      if (!activeRoomId) return { success: false, error: 'No room selected' };
      try {
        validator.validate(text);
        const chunks = text.match(/[\s\S]{1,2000}/gu) ?? [];
        chunks.forEach((chunk, index) => {
          const payload = new MessageBuilder()
            .setRoom(activeRoomId)
            .setMessage(chunk)
            // Only the first part of a long message quotes the original
            .setReplyTo(index === 0 ? replyToId : undefined)
            .build();
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

  const editMessage = useCallback(
    (messageId: string, text: string, previousText: string): { success: boolean; error?: string } => {
      try {
        validator.validate(text);
        if (text.length > 2000) return { success: false, error: 'Message is too long' };
        if (text !== previousText) socketEdit(messageId, text, previousText);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid message';
        return { success: false, error: message };
      }
    },
    [socketEdit, validator],
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
    editMessage,
    leaveChat,
    handleTyping,
    deleteMessage,
    loadMore,
  };
};