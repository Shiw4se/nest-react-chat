import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
