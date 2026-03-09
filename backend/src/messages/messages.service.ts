import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) { }

  async createMessage(userId: string, room: string, text: string) {
    return this.messagesRepository.create(userId, room, text);
  }

  async getMessagesForRoom(room: string, cursor?: string, limit: number = 50) {
    const messages = await this.messagesRepository.findManyByRoom(room, cursor, limit);

    return messages.reverse();
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messagesRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messagesRepository.delete(messageId);

    return messageId;
  }
}