import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { RoomType } from '@prisma/client';
import * as crypto from 'crypto';
import type { IRoomsRepository } from './rooms.repository.interface';
import { ROOMS_REPOSITORY } from './rooms.tokens';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @Inject(ROOMS_REPOSITORY)
    private readonly roomsRepository: IRoomsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, createRoomDto: CreateRoomDto) {
    const isPrivate = createRoomDto.type === RoomType.PRIVATE;
    const inviteToken = isPrivate
      ? crypto.randomBytes(16).toString('base64url')
      : null;
    return this.roomsRepository.create(
      userId,
      createRoomDto.name,
      createRoomDto.type,
      inviteToken,
    );
  }

  async getMyRooms(userId: string) {
    return this.roomsRepository.findMyRooms(userId);
  }

  async getPublicRooms() {
    return this.roomsRepository.findPublicRooms(); // served through the cache
  }

  async joinByToken(userId: string, inviteToken: string) {
    const room = await this.roomsRepository.findByInviteToken(inviteToken);
    if (!room) throw new NotFoundException('Invalid or expired invite link');
    const existing = await this.roomsRepository.findMember(userId, room.id);
    if (existing) return room;
    await this.roomsRepository.addMember(userId, room.id);
    return room;
  }

  async getInviteToken(userId: string, roomId: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId !== userId)
      throw new ForbiddenException('Only the owner can get the invite token');
    if (room.type !== RoomType.PRIVATE)
      throw new ForbiddenException('Only private rooms have invite tokens');
    return { inviteToken: room.inviteToken };
  }

  async regenerateInviteToken(userId: string, roomId: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId !== userId)
      throw new ForbiddenException(
        'Only the owner can regenerate the invite token',
      );
    if (room.type !== RoomType.PRIVATE)
      throw new ForbiddenException('Only private rooms have invite tokens');
    const newInviteToken = crypto.randomBytes(16).toString('base64url');
    await this.roomsRepository.updateToken(roomId, newInviteToken);
    return { inviteToken: newInviteToken };
  }

  async inviteByUsername(ownerId: string, roomId: string, username: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId !== ownerId)
      throw new ForbiddenException('Only the owner can invite users');
    const targetUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!targetUser)
      throw new NotFoundException(`User "${username}" not found`);
    const existing = await this.roomsRepository.findMember(
      targetUser.id,
      roomId,
    );
    if (existing)
      throw new ConflictException(`User "${username}" is already a member`);
    await this.roomsRepository.addMember(targetUser.id, roomId);
    return { message: `User "${username}" successfully invited` };
  }

  async getRoom(userId: string, roomId: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (!(await this.checkRoomAccess(userId, roomId)))
      throw new ForbiddenException('You do not have access to this room');
    const members = await this.roomsRepository.findMembers(roomId);
    // inviteToken is only exposed to the owner through the dedicated endpoint
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inviteToken, ...safeRoom } = room;
    return {
      ...safeRoom,
      members: members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        joinedAt: m.joinedAt,
        isOwner: m.user.id === room.ownerId,
      })),
    };
  }

  async leaveRoom(userId: string, roomId: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId === userId)
      throw new ForbiddenException(
        'The owner cannot leave the room. Delete it instead.',
      );
    const membership = await this.roomsRepository.findMember(userId, roomId);
    if (!membership) throw new NotFoundException('You are not a member');
    await this.roomsRepository.removeMember(userId, roomId);
    return { message: 'Left the room' };
  }

  async deleteRoom(userId: string, roomId: string) {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId !== userId)
      throw new ForbiddenException('Only the owner can delete the room');
    await this.roomsRepository.delete(roomId);
    return { message: 'Room deleted' };
  }

  /** Read-only access check: public rooms are open to everyone, private ones to members. */
  async checkRoomAccess(userId: string, roomId: string): Promise<boolean> {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) return false;
    if (room.type === RoomType.PUBLIC) return true;
    const membership = await this.roomsRepository.findMember(userId, roomId);
    return !!membership;
  }

  /** Like checkRoomAccess, but also records membership when a user enters a public room. */
  async joinRoom(userId: string, roomId: string): Promise<boolean> {
    const room = await this.roomsRepository.findById(roomId);
    if (!room) return false;
    if (room.type === RoomType.PUBLIC) {
      await this.roomsRepository.addMember(userId, roomId);
      return true;
    }
    const membership = await this.roomsRepository.findMember(userId, roomId);
    return !!membership;
  }
}
