import api from '../axios';
import type { Room, RoomDetails } from '../../types/room';
import { API_ROUTES } from '../../constants/apiRoutes';

export const RoomsApi = {
  getMyRooms: async (): Promise<Room[]> => {
    const { data } = await api.get<Room[]>(API_ROUTES.ROOMS.MY);
    return data;
  },

  getPublicRooms: async (): Promise<Room[]> => {
    const { data } = await api.get<Room[]>(API_ROUTES.ROOMS.PUBLIC);
    return data;
  },

  getRoom: async (roomId: string): Promise<RoomDetails> => {
    const { data } = await api.get<RoomDetails>(API_ROUTES.ROOMS.DETAILS(roomId));
    return data;
  },

  createRoom: async (name: string, type: 'PUBLIC' | 'PRIVATE'): Promise<Room> => {
    const { data } = await api.post<Room>(API_ROUTES.ROOMS.CREATE, { name, type });
    return data;
  },

  joinByToken: async (inviteToken: string): Promise<Room> => {
    const { data } = await api.post<Room>(API_ROUTES.ROOMS.JOIN(inviteToken));
    return data;
  },

  leaveRoom: async (roomId: string): Promise<{ message: string }> => {
    const { data } = await api.post(API_ROUTES.ROOMS.LEAVE(roomId));
    return data;
  },

  deleteRoom: async (roomId: string): Promise<{ message: string }> => {
    const { data } = await api.delete(API_ROUTES.ROOMS.DETAILS(roomId));
    return data;
  },

  getInviteToken: async (roomId: string): Promise<{ inviteToken: string }> => {
    const { data } = await api.get(API_ROUTES.ROOMS.INVITE_TOKEN(roomId));
    return data;
  },

  inviteByUsername: async (roomId: string, username: string): Promise<{ message: string }> => {
    const { data } = await api.post(API_ROUTES.ROOMS.INVITE_USER(roomId), { username });
    return data;
  },

  regenerateInviteToken: async (roomId: string): Promise<{ inviteToken: string }> => {
    const { data } = await api.patch(API_ROUTES.ROOMS.REGENERATE_INVITE_TOKEN(roomId));
    return data;
  },
};
