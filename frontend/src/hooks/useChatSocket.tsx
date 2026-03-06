import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useChatStore } from '../store/useChatStore';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import type { UserData } from '../types/auth';
import type { ChatMessage } from '../types/chat';
import { useAuthStore } from '../store/useAuthStore';
import { WebSocketManager } from '../websockets/services/WebSocketManager';

export const useChatSocket = (user: UserData | null) => {
  const { addMessage, setTyping, setIsConnected, setIsReconnecting } = useChatStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const socket = WebSocketManager.getInstance().socket;

  useEffect(() => {
    if (!user) return;

    const token = useAuthStore.getState().token;
    socket.auth = { token };
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit(SOCKET_EVENTS.JOIN, { room: user.room, username: user.username });
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socket.on(SOCKET_EVENTS.USER_JOINED, (data: { message: string }) => {
      toast.success(data.message);
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (message: ChatMessage) => {
      addMessage(message);
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, ({ username, isTyping }) => {
      setTyping(username, isTyping);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.USER_JOINED);

      socket.disconnect();
    };
  }, [user, addMessage, setTyping, setIsConnected, setIsReconnecting]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!user) return;
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { room: user.room, message: text });
      socket.emit(SOCKET_EVENTS.TYPING, { room: user.room, isTyping: false });
    },
    [user],
  );

  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!user) return;
      socket.emit(SOCKET_EVENTS.TYPING, { room: user.room, isTyping });
    },
    [user],
  );

  const handleTyping = useCallback(() => {
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 1500);
  }, [sendTypingStatus]);

  return { sendMessage, handleTyping };
};
