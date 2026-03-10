export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  MESSAGES: {
    GET_ROOM_HISTORY: (room: string) => `/messages/${room}`,
  },
  ROOMS: {
    MY: '/rooms/my',
    PUBLIC: '/rooms/public',
    CREATE: '/rooms',
    JOIN: (token: string) => `/rooms/join/${token}`,
    INVITE_TOKEN: (roomId: string) => `/rooms/${roomId}/invite-token`,
    INVITE_USER: (roomId: string) => `/rooms/${roomId}/invite-user`,
  },
};