import { Request } from 'express';
import { Socket } from 'socket.io';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    username: string;
  };
}

export interface ChatSocketData {
  /** Chat room this socket is currently viewing */
  roomId?: string;
}

export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    username: string;
  };
  data: ChatSocketData;
}
