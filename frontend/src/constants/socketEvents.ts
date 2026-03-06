export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  JOIN: 'join',
  USER_JOINED: 'userJoined',
  SEND_MESSAGE: 'SendMessage',
  NEW_MESSAGE: 'newMessage',
  TYPING: 'typing',
  USER_TYPING: 'userTyping',

  DELETE_MESSAGE: 'deleteMessage',
} as const;

export const DISCONNECT_REASONS = {
  IO_SERVER_DISCONNECT: 'io server disconnect',
} as const;