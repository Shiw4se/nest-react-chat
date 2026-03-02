import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getMessagesForRoom(room: string) {
    return this.prisma.message.findMany({
      where: {
        room: room,
      },
      orderBy: {
        createdAt: 'asc', 
      },
      include: {
        user: {
          select: {
            username: true, 
          },
        },
      },
    });
  }
}