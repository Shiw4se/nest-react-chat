import { useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import { useChatStore } from '../store/useChatStore';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { messagesService } from '../api/services/messagesService';
import type { UserData } from '../types/auth';
import type { ChatMessage } from '../types/chat';

export const useChatSocket = (user: UserData | null) => {
  const { addMessage, setMessages, setTyping , setIsConnected, setIsReconnecting } = useChatStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    socket.auth = { token: localStorage.getItem('token') };
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

    messagesService.getHistory(user.room)
      .then(setMessages)
      .catch(console.error);

    socket.emit(SOCKET_EVENTS.JOIN, { room: user.room, username: user.username });

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
    };
  }, [user, addMessage, setMessages, setTyping, setIsConnected, setIsReconnecting]);

  const sendMessage = (text: string) => {
    if (!user) return;
    socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { room: user.room, message: text });
    socket.emit(SOCKET_EVENTS.TYPING, { room: user.room, isTyping: false });
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if (!user) return;
    socket.emit(SOCKET_EVENTS.TYPING, { room: user.room, isTyping });
  };

  const handleTyping = () => {
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 1500);
  };

  return { sendMessage, handleTyping };
};