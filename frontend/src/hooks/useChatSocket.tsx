import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useChatStore } from '../store/useChatStore';
import { DISCONNECT_REASONS, SOCKET_EVENTS } from '../constants/socketEvents';
import type { UserData } from '../types/auth';
import type { ChatMessage } from '../types/chat';
import { useAuthStore } from '../store/useAuthStore';
import { WebSocketManager } from '../websockets/services/WebSocketManager';
import { ChatInvoker } from '../websockets/services/ChatInvoker';
import { DeleteMessageCommand } from '../websockets/commands/DeleteMessageCommand';
import { SendMessageCommand } from '../websockets/commands/SendMessageCommand';
import type { ChatMessagePayload } from '../types/message';

export const useChatSocket = (user: UserData | null, roomId: string | null) => {
  const { addMessage, setTyping, setIsConnected, setIsReconnecting, removeMessage } = useChatStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatInvoker = useRef(new ChatInvoker()).current;
  const socket = WebSocketManager.getInstance().socket;

  useEffect(() => {
    if (!user || !roomId) return;

    const token = useAuthStore.getState().token;
    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.JOIN, { roomId, username: user.username });
    }
  }, [user, roomId, socket]);

  useEffect(() => {
    if (!user || !roomId) return;

    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit(SOCKET_EVENTS.JOIN, { roomId, username: user.username });
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      if (reason === DISCONNECT_REASONS.IO_SERVER_DISCONNECT) {
        socket.connect();
      }
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setIsReconnecting(true);
    };

    const handleUserJoined = (data: { message: string }) => {
      toast.success(data.message);
    };

    const handleNewMessage = (message: ChatMessage) => {
      addMessage(message);
    };

    const handleUserTyping = ({ username, isTyping }: { username: string; isTyping: boolean }) => {
      setTyping(username, isTyping);
    };

    const handleDeleteMessage = ({ messageId }: { messageId: string }) => {
      removeMessage(messageId);
    };

    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
    socket.on(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
    socket.on(SOCKET_EVENTS.DELETE_MESSAGE, handleDeleteMessage);

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
      socket.off(SOCKET_EVENTS.USER_JOINED, handleUserJoined);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.USER_TYPING, handleUserTyping);
      socket.off(SOCKET_EVENTS.DELETE_MESSAGE, handleDeleteMessage);
    };
  }, [user, roomId, socket, addMessage, setTyping, setIsConnected, setIsReconnecting, removeMessage]);

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