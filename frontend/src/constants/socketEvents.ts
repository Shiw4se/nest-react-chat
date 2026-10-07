export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  JOIN: 'join',
  LEAVE: 'leave',
  USER_JOINED: 'userJoined',
  SEND_MESSAGE: 'sendMessage',
  NEW_MESSAGE: 'newMessage',
  TYPING: 'typing',
  USER_TYPING: 'userTyping',

  DELETE_MESSAGE: 'deleteMessage',
  EDIT_MESSAGE: 'editMessage',
  MESSAGE_EDITED: 'messageEdited',

  // server -> client: domain errors (forbidden join, failed send) and
  // validation failures (Nest WsException payloads)
  ERROR: 'ERROR',
  PRESENCE: 'presence',
  MARK_READ: 'markRead',
  ROOM_ACTIVITY: 'roomActivity',
  ROOM_ADDED: 'roomAdded',
  ROOM_REMOVED: 'roomRemoved',
  PRESENCE_SNAPSHOT: 'presenceSnapshot',
  EXCEPTION: 'exception',
} as const;

export const DISCONNECT_REASONS = {
  IO_SERVER_DISCONNECT: 'io server disconnect',
} as const;
