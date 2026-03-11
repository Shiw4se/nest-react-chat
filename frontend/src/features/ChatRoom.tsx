import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useChatSocket } from '../hooks/useChatSocket';
import { useChatHistory } from '../hooks/useChatHistory';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MessageBubble } from '../components/ui/MessageBubble';
import { ChatHeader } from './chat/components/ChatHeader';
import { TypingIndicator } from './chat/components/TypingIndicator';
import { useTranslation } from 'react-i18next';
import { WebSocketManager } from '../websockets/services/WebSocketManager';
import { MessageBuilder } from '../websockets/builders/MessageBuilder';
import { MessageValidatorContext, BasicValidator } from '../websockets/strategies/MessageValidator';
import { useChatTour } from '../hooks/useChatTour';
import { useRoomStore } from '../store/useRoomStore';

export const ChatRoom: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  const { messages, typingUsers, clearMessages } = useChatStore();

  const { activeRoomId, myRooms, publicRooms } = useRoomStore();

  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [oldScrollHeight, setOldScrollHeight] = useState<number | null>(null);

  const { loadMore, isLoadingMore } = useChatHistory(activeRoomId);
  const { sendMessage, handleTyping, deleteMessage } = useChatSocket(user, activeRoomId);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  const messageValidator = useMemo(() => {
    return new MessageValidatorContext(new BasicValidator());
  }, []);

  useChatTour(!!user, user?.username);

  useEffect(() => {
    if (oldScrollHeight === null) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastMessageId]);

  useEffect(() => {
    if (oldScrollHeight !== null && chatContainerRef.current) {
      const newScrollHeight = chatContainerRef.current.scrollHeight;
      chatContainerRef.current.scrollTop = newScrollHeight - oldScrollHeight;
      setOldScrollHeight(null);
    }
  }, [messages]);

  const onSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !activeRoomId) return;

    try {
      messageValidator.validate(text);
      const chunks = text.match(/[\s\S]{1,2000}/gu) || [];
      chunks.forEach((chunk) => {
        const payload = new MessageBuilder().setRoom(activeRoomId).setMessage(chunk).build();
        sendMessage(payload);
      });
      setInputText('');
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [inputText, sendMessage, activeRoomId, messageValidator]);

  const handleLeave = useCallback(() => {
    WebSocketManager.getInstance().disconnect();
    clearMessages();
    logout();
  }, [clearMessages, logout]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 5 && !isLoadingMore) {
      setOldScrollHeight(target.scrollHeight);
      loadMore();
    }
  };

  const handleDelete = useCallback(
    (id?: string) => {
      if (!id) {
        toast.error('Cannot delete a message that is still sending');
        return;
      }
      deleteMessage(id);
    },
    [deleteMessage],
  );

  if (!user) return null;

  const currentRoom = [...myRooms, ...publicRooms].find((r) => r.id === activeRoomId);
  const roomName = currentRoom?.name ?? '';

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-slate-900 text-slate-200 font-sans md:border-l border-slate-800 w-full overflow-hidden">
      <div id="tour-header" className="shrink-0">
        <ChatHeader room={roomName} username={user.username} onLeave={handleLeave} />
      </div>

      {!activeRoomId ? (
        <div 
          className="flex-1 flex items-center justify-center text-slate-500 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="text-5xl sm:text-6xl mb-4 opacity-20" aria-hidden="true">💬</div>
            <p className="text-base sm:text-lg font-medium">{t('chat.select_to_start')}</p>
          </div>
        </div>
      ) : (
        <>
          <main
            id="tour-messages"
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 relative focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onScroll={handleScroll}
            tabIndex={0}
            role="log"
            aria-label={t('chat.messages_history', 'Message history')}
          >
            {isLoadingMore && (
              <div 
                className="text-center text-blue-400 text-xs py-2 animate-pulse font-bold"
                role="status"
                aria-live="polite"
              >
                {t('chat.loading')}
              </div>
            )}

            {messages.length === 0 && !isLoadingMore ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm sm:text-base p-4 text-center">
                {t('chat.no_messages')}
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id ?? `${msg.user.username}-${msg.createdAt}`}
                  message={msg}
                  isMe={msg.user.username === user.username}
                  onDelete={() => handleDelete(msg.id)}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </main>

          <footer className="p-3 sm:p-4 bg-slate-800 border-t border-slate-700 relative shrink-0">
            <TypingIndicator users={typingUsers} />
            <div id="tour-input" className="flex gap-2 sm:gap-3 max-w-4xl mx-auto items-end pb-safe">
              <Input
                multiline
                value={inputText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setInputText(e.target.value);
                  handleTyping();
                }}
                onEnterPress={onSend}
                placeholder={t('chat.placeholder')}
                className="flex-1 min-h-[44px] focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                aria-label={t('chat.message_input_label', 'Type a message')}
              />
              <Button 
                onClick={onSend} 
                disabled={!inputText.trim()} 
                className="px-4 sm:px-6 py-2 sm:py-3 min-h-[44px] sm:h-[48px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                aria-label={t('chat.send_button', 'Send message')}
              >
                {t('chat.send')}
              </Button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};