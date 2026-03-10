import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { RoomType } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createRoomDto: CreateRoomDto) {
    const isPrivate = createRoomDto.type === RoomType.PRIVATE;
    const inviteToken = isPrivate ? crypto.randomBytes(16).toString('base64url') : null;

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          name: createRoomDto.name,
          type: createRoomDto.type,
          inviteToken,
          ownerId: userId,
        },
      });

      await tx.roomMember.create({
        data: { roomId: room.id, userId },
      });

      return room;
    });
  }

  async getMyRooms(userId: string) {
    return this.prisma.room.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicRooms() {
    return this.prisma.room.findMany({
      where: { type: RoomType.PUBLIC },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async joinByToken(userId: string, inviteToken: string) {
    const room = await this.prisma.room.findUnique({ where: { inviteToken } });
    if (!room) throw new NotFoundException('Invalid or expired invite link');

    const existingMember = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId: room.id } },
    });

    if (existingMember) return room;

    await this.prisma.roomMember.create({
      data: { userId, roomId: room.id },
    });

    return room;
  }

  async getInviteToken(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId !== userId) throw new ForbiddenException('Only the owner can get the invite token');
    if (room.type !== RoomType.PRIVATE) throw new ForbiddenException('Only private rooms have invite tokens');

    return { inviteToken: room.inviteToken };
  }

  async inviteByUsername(ownerId: string, roomId: string, username: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.ownerId !== ownerId) throw new ForbiddenException('Only the owner can invite users');

    const targetUser = await this.prisma.user.findUnique({ where: { username } });
    if (!targetUser) throw new NotFoundException(`User "${username}" not found`);

    const existing = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: targetUser.id, roomId } },
    });

    if (existing) throw new ConflictException(`User "${username}" is already a member`);

    await this.prisma.roomMember.create({
      data: { userId: targetUser.id, roomId },
    });

    return { message: `User "${username}" successfully invited` };
  }

  async checkRoomAccess(userId: string, roomId: string): Promise<boolean> {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return false;

    if (room.type === RoomType.PUBLIC) {
      await this.prisma.roomMember.upsert({
        where: { userId_roomId: { userId, roomId } },
        update: {},
        create: { userId, roomId },
      });
      return true;
    }

    const membership = await this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });

    return !!membership;
  }
}