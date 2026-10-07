import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { MessageBubble } from '../components/ui/MessageBubble';
import { ChatHeader } from './chat/components/ChatHeader';
import { TypingIndicator } from './chat/components/TypingIndicator';
import { useChatTour } from '../hooks/useChatTour';
import { useChatFacade } from '../hooks/useChatFacade';
import { useUIStore } from '../store/useUIStore';
import { buildMessageRows } from '../utils/messageRows';

export const ChatRoom: React.FC = () => {
  const { t, i18n } = useTranslation();

  const {
    user,
    messages,
    typingUsers,
    activeRoomId,
    currentRoom,
    isLoadingMore,
    sendMessage,
    handleTyping,
    deleteMessage,
    loadMore,
  } = useChatFacade();

  const openProfile = useUIStore((s) => s.openProfile);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const oldScrollHeightRef = useRef<number | null>(null);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  useChatTour(!!user, user?.username);

  // After older messages are prepended, keep the viewport anchored on the
  // message the user was looking at; otherwise follow the newest message.
  useEffect(() => {
    const container = chatContainerRef.current;
    const oldScrollHeight = oldScrollHeightRef.current;
    if (oldScrollHeight !== null && container) {
      container.scrollTop = container.scrollHeight - oldScrollHeight;
      oldScrollHeightRef.current = null;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, lastMessageId]);

  const rows = useMemo(
    () =>
      buildMessageRows(messages, {
        today: t('chat.today', 'Today'),
        yesterday: t('chat.yesterday', 'Yesterday'),
        locale: i18n.language,
      }),
    [messages, t, i18n.language],
  );

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
      oldScrollHeightRef.current = target.scrollHeight;
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

  return (
    <div className="flex-1 flex flex-col h-dvh text-slate-200 w-full overflow-hidden chat-bg">
      <div id="tour-header" className="shrink-0">
        <ChatHeader room={currentRoom} />
      </div>

      {!activeRoomId ? (
        <div
          className="flex-1 flex items-center justify-center text-slate-500 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="text-center flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-slate-800/80 flex items-center justify-center">
              <Icon name="chat" size={36} className="opacity-40" />
            </div>
            <p className="text-base sm:text-lg font-medium">{t('chat.select_to_start')}</p>
          </div>
        </div>
      ) : (
        <>
          <main
            id="tour-messages"
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/70"
            onScroll={handleScroll}
            tabIndex={0}
            role="log"
            aria-label={t('chat.messages_history', 'Message history')}
          >
            <div className="max-w-3xl mx-auto">
              {isLoadingMore && (
                <div
                  className="text-center text-sky-400 text-xs py-2 animate-pulse font-semibold"
                  role="status"
                  aria-live="polite"
                >
                  {t('chat.loading')}
                </div>
              )}

              {rows.length === 0 && !isLoadingMore ? (
                <div className="flex h-full min-h-[40vh] items-center justify-center text-slate-500 text-sm sm:text-base p-4 text-center">
                  <span className="bg-slate-800/70 px-4 py-2 rounded-full">
                    {t('chat.no_messages')}
                  </span>
                </div>
              ) : (
                rows.map((row) =>
                  row.kind === 'date' ? (
                    <div key={row.key} className="flex justify-center my-4">
                      <span className="text-[11px] font-medium text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full shadow">
                        {row.label}
                      </span>
                    </div>
                  ) : (
                    <MessageBubble
                      key={row.key}
                      message={row.message}
                      isMe={row.message.user.username === user.username}
                      showMeta={row.showMeta}
                      onDelete={() => handleDelete(row.message.id)}
                      onAuthorClick={() => openProfile(row.message.userId)}
                    />
                  ),
                )
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="px-3 sm:px-4 py-3 bg-slate-800/90 border-t border-slate-700/60 backdrop-blur-md relative shrink-0">
            <TypingIndicator users={typingUsers} />
            <div id="tour-input" className="flex gap-2 max-w-3xl mx-auto items-end pb-safe">
              <Input
                multiline
                value={inputText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setInputText(e.target.value);
                  handleTyping();
                }}
                onEnterPress={onSend}
                placeholder={t('chat.placeholder')}
                className="flex-1 min-h-11 text-[15px] bg-slate-900/80 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl px-4 py-2.5"
                aria-label={t('chat.message_input_label', 'Type a message')}
              />
              <Button
                onClick={onSend}
                disabled={!inputText.trim()}
                className="h-11.5 w-11.5 p-0! rounded-full shrink-0"
                aria-label={t('chat.send_button', 'Send message')}
                title={t('chat.send')}
              >
                <Icon name="send" size={20} className="-ml-0.5" />
              </Button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};
