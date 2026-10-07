import { Injectable } from '@nestjs/common';
import { RoomType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ownerId: string,
    name: string,
    type: RoomType,
    inviteToken: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: { name, type, inviteToken, ownerId },
      });
      await tx.roomMember.create({
        data: { roomId: room.id, userId: ownerId },
      });
      return room;
    });
  }

  async findMyRooms(userId: string) {
    return this.prisma.room.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublicRooms() {
    return this.prisma.room.findMany({
      where: { type: RoomType.PUBLIC },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.room.findUnique({ where: { id } });
  }

  async findByInviteToken(inviteToken: string) {
    return this.prisma.room.findUnique({ where: { inviteToken } });
  }

  async findMember(userId: string, roomId: string) {
    return this.prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
  }

  async findMembers(roomId: string) {
    return this.prisma.roomMember.findMany({
      where: { roomId },
      select: {
        joinedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateToken(roomId: string, inviteToken: string) {
    return this.prisma.room.update({
      where: { id: roomId },
      data: { inviteToken },
    });
  }

  async addMember(userId: string, roomId: string) {
    // upsert is atomic, so concurrent joins cannot race into a unique violation
    return this.prisma.roomMember.upsert({
      where: { userId_roomId: { userId, roomId } },
      create: { userId, roomId },
      update: {},
    });
  }

  async removeMember(userId: string, roomId: string) {
    return this.prisma.roomMember.deleteMany({ where: { userId, roomId } });
  }

  async delete(roomId: string) {
    // members and messages are removed by the cascade rules in the schema
    return this.prisma.room.delete({ where: { id: roomId } });
  }
}
