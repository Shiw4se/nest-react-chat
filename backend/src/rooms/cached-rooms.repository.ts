import { Injectable } from '@nestjs/common';
import { RoomType } from '@prisma/client';
import { RoomsRepository } from './rooms.repository';
import type {
  IRoomsRepository,
  PublicRooms,
} from './rooms.repository.interface';

const PUBLIC_ROOMS_TTL_MS = 30_000;

/**
 * Wraps RoomsRepository with a short in-memory cache for the public room list.
 * Any write that can change that list (or its member counts) drops the cache.
 */
@Injectable()
export class CachedRoomsRepository implements IRoomsRepository {
  private cachedRooms: PublicRooms | null = null;
  private expiresAt = 0;

  constructor(private readonly repository: RoomsRepository) {}

  async findPublicRooms(): Promise<PublicRooms> {
    const now = Date.now();
    if (this.cachedRooms && now < this.expiresAt) {
      return this.cachedRooms;
    }
    this.cachedRooms = await this.repository.findPublicRooms();
    this.expiresAt = now + PUBLIC_ROOMS_TTL_MS;
    return this.cachedRooms;
  }

  invalidatePublicCache(): void {
    this.cachedRooms = null;
    this.expiresAt = 0;
  }

  async create(
    ownerId: string,
    name: string,
    type: RoomType,
    inviteToken: string | null,
  ) {
    const result = await this.repository.create(
      ownerId,
      name,
      type,
      inviteToken,
    );
    if (type === RoomType.PUBLIC) this.invalidatePublicCache();
    return result;
  }

  async findMyRooms(userId: string) {
    return this.repository.findMyRooms(userId);
  }

  async findById(id: string) {
    return this.repository.findById(id);
  }

  async findByInviteToken(inviteToken: string) {
    return this.repository.findByInviteToken(inviteToken);
  }

  async findMember(userId: string, roomId: string) {
    return this.repository.findMember(userId, roomId);
  }

  async findMembers(roomId: string) {
    return this.repository.findMembers(roomId);
  }

  async findMemberIds(roomId: string) {
    return this.repository.findMemberIds(roomId);
  }

  async markRead(userId: string, roomId: string) {
    return this.repository.markRead(userId, roomId);
  }

  async findAttachmentUrls(roomId: string) {
    return this.repository.findAttachmentUrls(roomId);
  }

  async findLastMessage(roomId: string) {
    return this.repository.findLastMessage(roomId);
  }

  async updateToken(roomId: string, inviteToken: string) {
    return this.repository.updateToken(roomId, inviteToken);
  }

  async addMember(userId: string, roomId: string) {
    const result = await this.repository.addMember(userId, roomId);
    this.invalidatePublicCache();
    return result;
  }

  async removeMember(userId: string, roomId: string) {
    const result = await this.repository.removeMember(userId, roomId);
    this.invalidatePublicCache();
    return result;
  }

  async delete(roomId: string) {
    const result = await this.repository.delete(roomId);
    this.invalidatePublicCache();
    return result;
  }
}
