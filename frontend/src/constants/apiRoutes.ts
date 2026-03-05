export const API_ROUTES = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
    },
    MESSAGES: {
        GET_ROOM_HISTORY: (room: string) => `/messages/${room}`,
    },
};