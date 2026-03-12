import api from '../axios';
import { API_ROUTES } from '../../constants/apiRoutes';
import type { AuthResponse } from '../../types/auth';

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ROUTES.AUTH.LOGIN, { username, password });
    return res.data;
  },

  register: async (username: string, password: string): Promise<void> => {
    await api.post(API_ROUTES.AUTH.REGISTER, { username, password });
  },
};
