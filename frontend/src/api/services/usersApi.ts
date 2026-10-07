import api from '../axios';
import { API_ROUTES } from '../../constants/apiRoutes';
import type { UpdateProfilePayload, UserProfile } from '../../types/user';

export const UsersApi = {
  getMe: async (): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>(API_ROUTES.USERS.ME);
    return data;
  },

  getUser: async (userId: string): Promise<UserProfile> => {
    const { data } = await api.get<UserProfile>(API_ROUTES.USERS.BY_ID(userId));
    return data;
  },

  updateMe: async (
    payload: UpdateProfilePayload,
  ): Promise<Omit<UserProfile, 'stats'>> => {
    const { data } = await api.patch(API_ROUTES.USERS.ME, payload);
    return data;
  },

  uploadAvatar: async (file: File): Promise<Omit<UserProfile, 'stats'>> => {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await api.post(API_ROUTES.USERS.AVATAR, form);
    return data;
  },

  removeAvatar: async (): Promise<Omit<UserProfile, 'stats'>> => {
    const { data } = await api.delete(API_ROUTES.USERS.AVATAR);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.patch(API_ROUTES.USERS.PASSWORD, { currentPassword, newPassword });
  },
};
