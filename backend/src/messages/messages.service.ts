import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) { }

  async getMessagesForRoom(room: string, cursor?: string, limit: number = 50) {
    const messages = await this.prisma.message.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      where: {
        room: room,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return messages.reverse();
  }
}