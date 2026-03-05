import api from '../axios';
import { API_ROUTES } from '../../constants/apiRoutes';

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post(API_ROUTES.AUTH.LOGIN, { username, password });
    return res.data;
  },

  register: async (username: string, password: string) => {
    const res = await api.post(API_ROUTES.AUTH.REGISTER, { username, password });
    return res.data;
  },
};
