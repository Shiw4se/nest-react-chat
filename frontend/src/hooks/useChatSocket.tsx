import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import type { UserData } from '../types/auth';
import type { ChatMessage } from '../types/chat';
import { WebSocketManager } from '../websockets/services/WebSocketManager';
import { ChatInvoker } from '../websockets/services/ChatInvoker';
import { DeleteMessageCommand } from '../websockets/commands/DeleteMessageCommand';
import { SendMessageCommand } from '../websockets/commands/SendMessageCommand';
import type { ChatMessagePayload } from '../types/message';

/**
 * Events of the room being viewed. The connection itself is owned by
 * useSocketConnection; this hook only joins/leaves rooms and listens to them.
 */
export const useChatSocket = (user: UserData | null, roomId: string | null) => {
  const { addMessage, setTyping, removeMessage } = useChatStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chatInvoker] = useState(() => new ChatInvoker());
  const socket = WebSocketManager.getInstance().socket;

  useEffect(() => {
    if (!user || !roomId) {
      // Left the room (or logged out): stop receiving that room's events.
      if (socket.connected) socket.emit(SOCKET_EVENTS.LEAVE);
      return;
    }

    // Join now if connected, and again after every reconnect
    const join = () => socket.emit(SOCKET_EVENTS.JOIN, { roomId });
    if (socket.connected) join();

    const handleNewMessage = (message: ChatMessage) => {
      if (message.roomId === roomId) addMessage(message);
    };
    const handleUserTyping = ({ username, isTyping }: { username: string; isTyping: boolean }) => {
      setTyping(username, isTyping);
    };
    const handleDeleteMessage = ({ messageId }: { messageId: string }) => {
      removeMessage(messageId);
    };

    socket.on(SOCKET_EVENTS.CONNECT, join);
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.DELETE_MESSAGE, handleDeleteMessage);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, join);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.DELETE_MESSAGE, handleDeleteMessage);
    };
  }, [user, roomId, socket, addMessage, setTyping, removeMessage]);

  const sendMessage = useCallback(
    (payload: ChatMessagePayload) => {
      const command = new SendMessageCommand(socket, payload.roomId, payload.message);
      chatInvoker.executeCommand(command);
    },
    [socket, chatInvoker],
  );

  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!user || !roomId) return;
      socket.emit(SOCKET_EVENTS.TYPING, { roomId, isTyping });
    },
    [user, roomId, socket],
  );

  const handleTyping = useCallback(() => {
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 1500);
  }, [sendTypingStatus]);

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!user || !roomId) return;
      const command = new DeleteMessageCommand(socket, roomId, messageId);
      chatInvoker.executeCommand(command);
    },
    [user, roomId, socket, chatInvoker],
  );

  return { sendMessage, handleTyping, deleteMessage, chatInvoker };
};
