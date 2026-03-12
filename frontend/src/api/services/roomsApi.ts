import axios from '../axios';
import type { Room } from '../../types/room';
import { API_ROUTES } from '../../constants/apiRoutes';

export const RoomsApi = {
  getMyRooms: async (): Promise<Room[]> => {
    const { data } = await axios.get<Room[]>(API_ROUTES.ROOMS.MY);
    return data;
  },

  getPublicRooms: async (): Promise<Room[]> => {
    const { data } = await axios.get<Room[]>(API_ROUTES.ROOMS.PUBLIC);
    return data;
  },

  createRoom: async (name: string, type: 'PUBLIC' | 'PRIVATE'): Promise<Room> => {
    const { data } = await axios.post<Room>(API_ROUTES.ROOMS.CREATE, { name, type });
    return data;
  },

  joinByToken: async (inviteToken: string): Promise<Room> => {
    const { data } = await axios.post<Room>(API_ROUTES.ROOMS.JOIN(inviteToken));
    return data;
  },

  getInviteToken: async (roomId: string): Promise<{ inviteToken: string }> => {
    const { data } = await axios.get(API_ROUTES.ROOMS.INVITE_TOKEN(roomId));
    return data;
  },

  inviteByUsername: async (roomId: string, username: string): Promise<{ message: string }> => {
    const { data } = await axios.post(API_ROUTES.ROOMS.INVITE_USER(roomId), { username });
    return data;
  },

  regenerateInviteToken: async (roomId: string) => {
    const response = await axios.patch(API_ROUTES.ROOMS.REGENERATE_INVITE_TOKEN(roomId));
    return response.data;
  },
};
