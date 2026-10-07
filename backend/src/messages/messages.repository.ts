import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Raw reaction rows in the order they were added; clients group them */
const REACTIONS_SELECT = {
  select: { emoji: true, userId: true },
  orderBy: { createdAt: 'asc' },
} satisfies Prisma.Message$reactionsArgs;

/** Everything a client needs to render a message bubble */
export const MESSAGE_INCLUDE = {
  user: {
    select: { username: true, displayName: true, avatarUrl: true },
  },
  replyTo: {
    select: {
      id: true,
      message: true,
      userId: true,
      user: { select: { username: true, displayName: true } },
    },
  },
  reactions: REACTIONS_SELECT,
} satisfies Prisma.MessageInclude;

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    roomId: string,
    message: string,
    replyToId?: string,
  ) {
    return this.prisma.message.create({
      data: {
        message,
        roomId,
        userId,
        replyToId,
      },
      include: MESSAGE_INCLUDE,
    });
  }

  async findManyByRoom(roomId: string, cursor?: string, limit: number = 50) {
    const messages = await this.prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      where: { roomId },
      orderBy: [{ createdAt: 'desc' }, { seq: 'desc' }],
      include: MESSAGE_INCLUDE,
    });

    return messages.reverse();
  }

  async findById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
    });
  }

  async updateText(id: string, message: string) {
    return this.prisma.message.update({
      where: { id },
      data: { message, editedAt: new Date() },
      include: MESSAGE_INCLUDE,
    });
  }

  /** Adds the reaction, or removes it if the user already had it. Returns all reactions. */
  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const key = { messageId_userId_emoji: { messageId, userId, emoji } };
    const existing = await this.prisma.reaction.findUnique({ where: key });
    if (existing) {
      // deleteMany: a racing second click finds nothing to delete instead of throwing
      await this.prisma.reaction.deleteMany({
        where: { messageId, userId, emoji },
      });
    } else {
      // upsert tolerates a double click racing with itself
      await this.prisma.reaction.upsert({
        where: key,
        create: { messageId, userId, emoji },
        update: {},
      });
    }
    return this.prisma.reaction.findMany({
      where: { messageId },
      ...REACTIONS_SELECT,
    });
  }

  async delete(id: string) {
    return this.prisma.message.delete({
      where: { id },
    });
  }
}
