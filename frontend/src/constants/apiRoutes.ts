export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  USERS: {
    ME: '/users/me',
    PASSWORD: '/users/me/password',
    AVATAR: '/users/me/avatar',
    BY_ID: (userId: string) => `/users/${userId}`,
  },
  MESSAGES: {
    GET_ROOM_HISTORY: (room: string) => `/messages/${room}`,
  },
  ROOMS: {
    MY: '/rooms/my',
    PUBLIC: '/rooms/public',
    CREATE: '/rooms',
    DETAILS: (roomId: string) => `/rooms/${roomId}`,
    LEAVE: (roomId: string) => `/rooms/${roomId}/leave`,
    JOIN: (token: string) => `/rooms/join/${token}`,
    INVITE_TOKEN: (roomId: string) => `/rooms/${roomId}/invite-token`,
    INVITE_USER: (roomId: string) => `/rooms/${roomId}/invite-user`,
    REGENERATE_INVITE_TOKEN: (roomId: string) => `/rooms/${roomId}/invite-token`,
  },
};
