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
import type { ChatMessagePayload } from '../websockets/builders/MessageBuilder';

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


  }, [user, socket]);


  useEffect(() => {
    if (!user) return;

    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      socket.emit(SOCKET_EVENTS.JOIN, { room: user.room, username: user.username });
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

    const handleUserTyping = ({ username, isTyping }: { username: string, isTyping: boolean }) => {
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
  }, [user, socket, addMessage, setTyping, setIsConnected, setIsReconnecting, removeMessage]);


  const sendMessage = useCallback((payload: ChatMessagePayload) => {
    socket.emit(SOCKET_EVENTS.SEND_MESSAGE, payload);
  }, [socket]);

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