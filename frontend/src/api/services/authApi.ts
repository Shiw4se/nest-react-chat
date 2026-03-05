import api from '../axios';

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  register: async (username: string, password: string) => {
    const res = await api.post('/auth/register', { username, password });
    return res.data;
  },
};
