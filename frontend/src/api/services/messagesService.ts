import axios from '../axios';
import type { ChatMessage } from '../../types/chat';

export const messagesService = {
  getHistory: async (room: string): Promise<ChatMessage[]> => {
    const res = await axios.get(`/messages/${room}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return res.data;
  }
};