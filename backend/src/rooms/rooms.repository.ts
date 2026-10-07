import { Injectable } from '@nestjs/common';
import { Prisma, RoomType } from '@prisma/client';

/** Fields shown as the room's last-message preview */
export const MESSAGE_PREVIEW_SELECT = {
  id: true,
  message: true,
  createdAt: true,
  userId: true,
  user: { select: { username: true, displayName: true } },
} satisfies Prisma.MessageSelect;
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

  /**
   * The user's rooms with the last message and the unread count, most
   * recently active first (Telegram order).
   */
  async findMyRooms(userId: string) {
    const [rooms, unread] = await Promise.all([
      this.prisma.room.findMany({
        where: { members: { some: { userId } } },
        include: {
          _count: { select: { members: true } },
          messages: {
            take: 1,
            orderBy: [{ createdAt: 'desc' }, { seq: 'desc' }],
            select: MESSAGE_PREVIEW_SELECT,
          },
        },
      }),
      // One grouped query instead of a count per room
      this.prisma.$queryRaw<{ roomId: string; count: number }[]>`
        SELECT m."roomId", COUNT(*)::int AS count
        FROM "Message" m
        JOIN "RoomMember" rm
          ON rm."roomId" = m."roomId" AND rm."userId" = ${userId}
        WHERE m."createdAt" > rm."lastReadAt" AND m."userId" <> ${userId}
        GROUP BY m."roomId"
      `,
    ]);

    const unreadByRoom = new Map(unread.map((u) => [u.roomId, u.count]));
    return rooms
      .map(({ messages, ...room }) => ({
        ...room,
        lastMessage: messages[0] ?? null,
        unreadCount: unreadByRoom.get(room.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          (b.lastMessage?.createdAt ?? b.createdAt).getTime() -
          (a.lastMessage?.createdAt ?? a.createdAt).getTime(),
      );
  }

  async findMemberIds(roomId: string): Promise<string[]> {
    const members = await this.prisma.roomMember.findMany({
      where: { roomId },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  async markRead(userId: string, roomId: string) {
    await this.prisma.roomMember.updateMany({
      where: { userId, roomId },
      data: { lastReadAt: new Date() },
    });
  }

  async findLastMessage(roomId: string) {
    return this.prisma.message.findFirst({
      where: { roomId },
      orderBy: [{ createdAt: 'desc' }, { seq: 'desc' }],
      select: MESSAGE_PREVIEW_SELECT,
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
