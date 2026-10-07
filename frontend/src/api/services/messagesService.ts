import api from '../axios';
import type { ChatMessage } from '../../types/chat';
import { API_ROUTES } from '../../constants/apiRoutes';

export const messagesService = {
  getHistory: async (room: string, cursor?: string, limit: number = 50): Promise<ChatMessage[]> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const res = await api.get(`${API_ROUTES.MESSAGES.GET_ROOM_HISTORY(room)}?${params.toString()}`);
    return res.data;
  },

  /** Uploads an image; the created message is delivered to everyone over the socket. */
  uploadAttachment: async (
    roomId: string,
    file: File,
    options: { caption?: string; replyToId?: string; onProgress?: (percent: number) => void } = {},
  ): Promise<ChatMessage> => {
    const form = new FormData();
    form.append('file', file);
    if (options.caption) form.append('caption', options.caption);
    if (options.replyToId) form.append('replyToId', options.replyToId);

    const res = await api.post<ChatMessage>(API_ROUTES.MESSAGES.ATTACHMENTS(roomId), form, {
      onUploadProgress: (e) => {
        if (e.total) options.onProgress?.(Math.round((e.loaded / e.total) * 100));
      },
    });
    return res.data;
  },
};
