import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, roomId: string, message: string) {
    return this.prisma.message.create({
      data: {
        message,
        roomId,
        userId,
      },
      include: {
        user: { select: { username: true } },
      },
    });
  }

  async findManyByRoom(roomId: string, cursor?: string, limit: number = 50) {
    const messages = await this.prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
      },
    });

    return messages.reverse();
  }

  async findById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.message.delete({
      where: { id },
    });
  }
}
