import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useChatStore } from '../store/useChatStore';
import { DISCONNECT_REASONS, SOCKET_EVENTS } from '../constants/socketEvents';
import type { UserData } from '../types/auth';
import type { ChatMessage } from '../types/chat';
import { useAuthStore } from '../store/useAuthStore';
import { WebSocketManager } from '../websockets/services/WebSocketManager';
import { SendMessageCommand } from '../websockets/commands/SendMessageCommand';
import { ChatInvoker } from '../websockets/services/ChatInvoker';
import { DeleteMessageCommand } from '../websockets/commands/DeleteMessageCommand';

export const useChatSocket = (user: UserData | null) => {
  const { addMessage, setTyping, setIsConnected, setIsReconnecting, removeMessage } = useChatStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatInvoker = useRef(new ChatInvoker()).current;
  const socket = WebSocketManager.getInstance().socket;

  useEffect(() => {
    if (!user) return;

    const token = useAuthStore.getState().token;
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();

    }

    socket.on(SOCKET_EVENTS.CONNECT, () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit(SOCKET_EVENTS.JOIN, { room: user.room, username: user.username });
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      setIsConnected(false);
      if (reason === DISCONNECT_REASONS.IO_SERVER_DISCONNECT) {
        socket.connect();
      }
    });

    socket.on(SOCKET_EVENTS.CONNECT_ERROR, () => {
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

    socket.on(SOCKET_EVENTS.DELETE_MESSAGE, ({ messageId }) => {
      removeMessage(messageId);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.USER_JOINED);
      socket.off(SOCKET_EVENTS.DELETE_MESSAGE);

      socket.disconnect();
    };
  }, [user, addMessage, setTyping, setIsConnected, setIsReconnecting]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!user) return;

      const sendCommand = new SendMessageCommand(socket, user, text);
      chatInvoker.executeCommand(sendCommand);
    },
    [user, socket, chatInvoker],
  );

  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      if (!user) return;
      socket.emit(SOCKET_EVENTS.TYPING, { room: user.room, isTyping });
    },
    [user, socket],
  );

  const handleTyping = useCallback(() => {
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStatus(false), 1500);
  }, [sendTypingStatus]);

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!user) return;

      const deleteCommand = new DeleteMessageCommand(socket, user.room, messageId);
      chatInvoker.executeCommand(deleteCommand);
    },
    [user, socket, chatInvoker]
  );

  return { sendMessage, handleTyping, deleteMessage, chatInvoker };
};
