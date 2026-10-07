import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { WebSocketManager } from '../websockets/services/WebSocketManager';
import i18n from '../config/i18n';

const api = axios.create({
  // Empty VITE_API_URL = same origin (/v1), used by the Docker image
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/v1`,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or invalid token on any authenticated request sends the user
// back to the login form instead of leaving the app in a half-broken state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isAuthRoute = String(error?.config?.url ?? '').startsWith('/auth/');
    const wasLoggedIn = !!useAuthStore.getState().token;

    if (status === 401 && !isAuthRoute && wasLoggedIn) {
      WebSocketManager.getInstance().disconnect();
      useAuthStore.getState().clearAuth();
      toast.error(i18n.t('auth.session_expired'));
    }
    return Promise.reject(error);
  },
);

/** Extracts the backend error message from an axios error, if any. */
export const getApiErrorMessage = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;
    return Array.isArray(message) ? message.join(', ') : message;
  }
  return undefined;
};

export default api;
