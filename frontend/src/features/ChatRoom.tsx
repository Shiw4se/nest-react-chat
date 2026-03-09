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

export const ChatRoom: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearAuth);
  const { messages, typingUsers, clearMessages } = useChatStore();

  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [oldScrollHeight, setOldScrollHeight] = useState<number | null>(null);

  const { loadMore, isLoadingMore } = useChatHistory(user?.room);
  const { sendMessage, handleTyping, deleteMessage } = useChatSocket(user);

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

  const onSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    try {
      messageValidator.validate(inputText);

      const payload = new MessageBuilder()
        .setRoom(user!.room)
        .setMessage(inputText.trim())
        .build();

      sendMessage(payload);
      setInputText('');
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [inputText, sendMessage, user, messageValidator]);

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

  const handleDelete = useCallback((id?: string) => {
    if (!id) {
      console.warn('Cannot delete message without an ID');
      return;
    }
    deleteMessage(id);
  }, [deleteMessage]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200 font-sans">
      <div id="tour-header">
        <ChatHeader room={user.room} username={user.username} onLeave={handleLeave} />
      </div>

      <main
        id="tour-messages"
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        onScroll={handleScroll}
      >
        {isLoadingMore && (
          <div className="text-center text-blue-400 text-xs py-2 animate-pulse font-bold">
            Loading older messages...
          </div>
        )}

        {messages.length === 0 && !isLoadingMore ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            {t('chat.no_messages')}
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg}
              isMe={msg.user.username === user.username}
              onDelete={() => handleDelete(msg.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-800 border-t border-slate-700 relative">
        <TypingIndicator users={typingUsers} />
        <form id="tour-input" onSubmit={onSend} className="flex gap-3 max-w-4xl mx-auto">
          <Input
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTyping();
            }}
            placeholder={t('chat.placeholder')}
            className="flex-1"
          />
          <Button type="submit" disabled={!inputText.trim()} className="px-6 py-3">
            {t('chat.send')}
          </Button>
        </form>
      </footer>
    </div>
  );
};