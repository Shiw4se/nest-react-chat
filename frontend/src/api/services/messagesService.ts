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
};
