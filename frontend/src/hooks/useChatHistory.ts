import { useEffect, useState, useCallback } from 'react';
import { messagesService } from '../api/services/messagesService';
import { useChatStore } from '../store/useChatStore';

export const useChatHistory = (room: string | null) => {
  const { messages, setMessages, prependMessages, hasMore, setHasMore, clearMessages } = useChatStore();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!room) return;

    clearMessages();

    messagesService
      .getHistory(room)
      .then((msgs) => {
        setMessages(msgs);
        setHasMore(msgs.length === 50);
      })
      .catch((error) => console.error('Failed to load chat history:', error));
  }, [room]); 

  const loadMore = useCallback(async () => {
    if (!room || isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestMessageId = messages[0].id;
      const olderMessages = await messagesService.getHistory(room, oldestMessageId);

      if (olderMessages.length > 0) {
        prependMessages(olderMessages);
      }
      if (olderMessages.length < 50) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load older messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [room, isLoadingMore, hasMore, messages, prependMessages, setHasMore]);

  return { loadMore, isLoadingMore };
};