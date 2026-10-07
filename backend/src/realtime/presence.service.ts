import { Injectable } from '@nestjs/common';

/**
 * Tracks which users have at least one open socket. A user can be connected
 * from several tabs or devices, so presence changes only on the first
 * connection and after the last disconnection.
 *
 * In-memory: correct for a single backend instance. Several instances would
 * need a shared store (e.g. Redis) and the Socket.IO Redis adapter.
 */
@Injectable()
export class PresenceService {
  private readonly sockets = new Map<string, Set<string>>();

  /** Returns true when this connection made the user go online. */
  connect(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (set) {
      set.add(socketId);
      return false;
    }
    this.sockets.set(userId, new Set([socketId]));
    return true;
  }

  /** Returns true when this disconnection made the user go offline. */
  disconnect(userId: string, socketId: string): boolean {
    const set = this.sockets.get(userId);
    if (!set) return false;
    set.delete(socketId);
    if (set.size > 0) return false;
    this.sockets.delete(userId);
    return true;
  }

  isOnline(userId: string): boolean {
    return this.sockets.has(userId);
  }

  onlineUserIds(): string[] {
    return Array.from(this.sockets.keys());
  }
}
