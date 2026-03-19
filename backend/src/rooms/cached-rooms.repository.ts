import { Injectable } from '@nestjs/common';
import { RoomType } from '@prisma/client';
import { RoomsRepository } from './rooms.repository';

const PUBLIC_ROOMS_TTL_MS = 30_000; 

type PublicRooms = Awaited<ReturnType<RoomsRepository['findPublicRooms']>>;


// NOTE: This cache is in-process memory. In a multi-instance deployment
// each process maintains its own independent cache. For horizontal scaling,
// replace with a distributed cache (e.g. Redis).
@Injectable()
export class CachedRoomsRepository {
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

  async create(ownerId: string, name: string, type: RoomType, inviteToken: string | null) {
    const result = await this.repository.create(ownerId, name, type, inviteToken);
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

  async updateToken(roomId: string, inviteToken: string) {
    return this.repository.updateToken(roomId, inviteToken);
  }

  async addMember(userId: string, roomId: string) {
    return this.repository.addMember(userId, roomId);
  }
}