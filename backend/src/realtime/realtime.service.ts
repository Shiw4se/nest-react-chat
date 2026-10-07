import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';

/** Socket.IO room that every connection of a user joins. */
export const userChannel = (userId: string) => `user:${userId}`;

/**
 * Lets any module push events to clients without depending on the gateway
 * (which would create a module cycle: the gateway already depends on them).
 * The gateway hands over its server in afterInit().
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  attach(server: Server) {
    this.server = server;
  }

  toUsers(userIds: string[], event: string, payload: unknown) {
    if (!this.server || userIds.length === 0) return;
    this.server.to(userIds.map(userChannel)).emit(event, payload);
  }

  toUser(userId: string, event: string, payload: unknown) {
    this.toUsers([userId], event, payload);
  }

  toRoom(roomId: string, event: string, payload: unknown) {
    this.server?.to(roomId).emit(event, payload);
  }

  broadcast(event: string, payload: unknown) {
    if (!this.server) {
      this.logger.warn(`Dropped "${event}": server not attached yet`);
      return;
    }
    this.server.emit(event, payload);
  }
}
