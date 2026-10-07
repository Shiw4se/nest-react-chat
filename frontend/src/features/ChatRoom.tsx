import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Icon } from '../components/ui/Icon';
import { MessageBubble } from '../components/ui/MessageBubble';
import { ChatHeader } from './chat/components/ChatHeader';
import { TypingIndicator } from './chat/components/TypingIndicator';
import { Composer, type ComposerMode } from './chat/components/Composer';
import { AttachmentDialog } from './chat/components/AttachmentDialog';
import { Lightbox } from '../components/ui/Lightbox';
import { firstImage, imageFileError } from '../utils/imageFile';
import { useChatTour } from '../hooks/useChatTour';
import { useChatFacade } from '../hooks/useChatFacade';
import { useUIStore } from '../store/useUIStore';
import { buildMessageRows } from '../utils/messageRows';
import type { ChatMessage } from '../types/chat';

const HIGHLIGHT_MS = 1600;

const showError = (error?: string) => {
  if (error) toast.error(error);
};

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
    editMessage,
    handleTyping,
    deleteMessage,
    toggleReaction,
    loadMore,
  } = useChatFacade();

  const openProfile = useUIStore((s) => s.openProfile);
  // Reply/edit state is tied to the room it was started in
  const [composer, setComposer] = useState<{ roomId: string | null; mode: ComposerMode }>({
    roomId: null,
    mode: null,
  });
  const composerMode = composer.roomId === activeRoomId ? composer.mode : null;
  const setComposerMode = useCallback(
    (mode: ComposerMode) => setComposer({ roomId: activeRoomId, mode }),
    [activeRoomId],
  );

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; caption?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const oldScrollHeightRef = useRef<number | null>(null);
  const prevLastIdRef = useRef<string | null>(null);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  useChatTour(!!user, user?.username);

  // Prepending older messages keeps the viewport on what the user was reading;
  // a new last message scrolls to the bottom; edits and reactions do not scroll.
  useEffect(() => {
    const container = chatContainerRef.current;
    const oldScrollHeight = oldScrollHeightRef.current;
    if (oldScrollHeight !== null && container) {
      container.scrollTop = container.scrollHeight - oldScrollHeight;
      oldScrollHeightRef.current = null;
    } else if (lastMessageId !== prevLastIdRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLastIdRef.current = lastMessageId;
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

  const handleSend = useCallback(
    (text: string) => {
      const replyToId = composerMode?.type === 'reply' ? composerMode.message.id : undefined;
      const { success, error } = sendMessage(text, replyToId);
      if (success) setComposerMode(null);
      else showError(error);
      return success;
    },
    [composerMode, sendMessage, setComposerMode],
  );

  const handleSaveEdit = useCallback(
    (message: ChatMessage, text: string) => {
      const { success, error } = editMessage(message.id, text, message.message, {
        allowEmpty: !!message.attachmentUrl,
      });
      if (success) setComposerMode(null);
      else showError(error);
      return success;
    },
    [editMessage, setComposerMode],
  );

  const handleEditLast = useCallback(() => {
    const lastOwn = [...messages].reverse().find((m) => m.userId === user?.id);
    if (lastOwn) setComposerMode({ type: 'edit', message: lastOwn });
  }, [messages, user?.id, setComposerMode]);

  const jumpToMessage = useCallback(
    (messageId: string) => {
      const el = document.getElementById(`msg-${messageId}`);
      if (!el) {
        toast(t('chat.reply_not_loaded'), { icon: '↑' });
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightId(messageId);
      window.setTimeout(() => setHighlightId((id) => (id === messageId ? null : id)), HIGHLIGHT_MS);
    },
    [t],
  );

  const pickFile = useCallback(
    (file: File) => {
      const error = imageFileError(file);
      if (error) {
        toast.error(t(error));
        return;
      }
      setPendingFile(file);
    },
    [t],
  );

  // Drag & drop anywhere over the chat; the depth counter ignores child enter/leave noise
  const dragHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      dragDepthRef.current += 1;
      setIsDragging(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes('Files')) e.preventDefault();
    },
    onDragLeave: () => {
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);
      const image = firstImage(e.dataTransfer.files);
      if (image) pickFile(image);
    },
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 5 && !isLoadingMore) {
      oldScrollHeightRef.current = target.scrollHeight;
      loadMore();
    }
  };

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
        <div className="relative flex-1 flex flex-col min-h-0" {...dragHandlers}>
          {isDragging && (
            <div className="absolute inset-3 z-30 rounded-2xl border-2 border-dashed border-sky-400 bg-slate-900/80 flex flex-col items-center justify-center gap-3 text-sky-300 pointer-events-none">
              <Icon name="image" size={40} />
              <p className="text-base font-medium">{t('attachment.drop_here')}</p>
            </div>
          )}
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
                rows.map((row) => {
                  if (row.kind === 'date') {
                    return (
                      <div key={row.key} className="flex justify-center my-4">
                        <span className="text-[11px] font-medium text-slate-300 bg-slate-800/80 px-3 py-1 rounded-full shadow">
                          {row.label}
                        </span>
                      </div>
                    );
                  }
                  const msg = row.message;
                  const isMe = msg.userId === user.id;
                  return (
                    <MessageBubble
                      key={row.key}
                      message={msg}
                      isMe={isMe}
                      showMeta={row.showMeta}
                      highlighted={highlightId === msg.id}
                      onReply={() => setComposerMode({ type: 'reply', message: msg })}
                      onEdit={isMe ? () => setComposerMode({ type: 'edit', message: msg }) : undefined}
                      onDelete={isMe ? () => deleteMessage(msg.id) : undefined}
                      onAuthorClick={() => openProfile(msg.userId)}
                      onQuoteClick={jumpToMessage}
                      onReact={(emoji) => toggleReaction(msg.id, emoji)}
                      onImageClick={(src) => setLightbox({ src, caption: msg.message })}
                      currentUserId={user.id}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="px-3 sm:px-4 py-3 bg-slate-800/90 border-t border-slate-700/60 backdrop-blur-md relative shrink-0">
            <TypingIndicator users={typingUsers} />
            <Composer
              mode={composerMode}
              onSend={handleSend}
              onSaveEdit={handleSaveEdit}
              onCancelMode={() => setComposerMode(null)}
              onEditLast={handleEditLast}
              onTyping={handleTyping}
              onPickFile={pickFile}
            />
          </footer>
        </div>
      )}

      {pendingFile && activeRoomId && (
        <AttachmentDialog
          roomId={activeRoomId}
          file={pendingFile}
          replyTo={composerMode?.type === 'reply' ? composerMode.message : null}
          onClose={() => setPendingFile(null)}
          onSent={() => {
            setPendingFile(null);
            if (composerMode?.type === 'reply') setComposerMode(null);
          }}
        />
      )}

      {lightbox && (
        <Lightbox src={lightbox.src} caption={lightbox.caption} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
};
