import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MessageBubble } from '../components/ui/MessageBubble';
import { ChatHeader } from './chat/components/ChatHeader';
import { TypingIndicator } from './chat/components/TypingIndicator';
import { useChatTour } from '../hooks/useChatTour';
import { useChatFacade } from '../hooks/useChatFacade';

export const ChatRoom: React.FC = () => {
  const { t } = useTranslation();

  const {
    user,
    messages,
    typingUsers,
    activeRoomId,
    currentRoom,
    isLoadingMore,
    sendMessage,
    leaveChat,
    handleTyping,
    deleteMessage,
    loadMore,
  } = useChatFacade();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [oldScrollHeight, setOldScrollHeight] = useState<number | null>(null);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

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
    if (!text) return;

    const { success, error } = sendMessage(text);
    if (success) {
      setInputText('');
    } else if (error) {
      toast.error(error);
    }
  }, [inputText, sendMessage]);

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

  const roomName = currentRoom?.name ?? '';

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-slate-900 text-slate-200 font-sans md:border-l border-slate-800 w-full overflow-hidden">
      <div id="tour-header" className="shrink-0">
        <ChatHeader room={roomName} username={user.username} onLeave={leaveChat} />
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

          <footer className="p-3 sm:p-4 bg-slate-800/50 border-t border-slate-700/50 backdrop-blur-md relative shrink-0">
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
                className="flex-1 min-h-[44px] text-sm sm:text-base bg-slate-900 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-xl px-4 py-2"
                aria-label={t('chat.message_input_label', 'Type a message')}
              />
              <Button
                onClick={onSend}
                disabled={!inputText.trim()}
                className="px-5 sm:px-8 py-2 sm:py-3 h-[44px] sm:h-[48px] rounded-xl font-bold bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg disabled:opacity-50 disabled:bg-slate-700"
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