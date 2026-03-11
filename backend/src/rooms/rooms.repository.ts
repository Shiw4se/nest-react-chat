import { Injectable } from '@nestjs/common';
import { RoomType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(ownerId: string, name: string, type: RoomType, inviteToken: string | null) {
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

  async addMember(userId: string, roomId: string) {
    return this.prisma.roomMember.upsert({
      where: { userId_roomId: { userId, roomId } },
      update: {},
      create: { userId, roomId },
    });
  }

  async updateToken(roomId: string, inviteToken: string) {
    return this.prisma.room.update({
      where: { id: roomId },
      data: { inviteToken },
    });
  }
}