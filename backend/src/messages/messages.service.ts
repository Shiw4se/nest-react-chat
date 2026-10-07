import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  private sanitize(text: string) {
    return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
  }

  async createMessage(
    userId: string,
    roomId: string,
    text: string,
    replyToId?: string,
  ) {
    if (replyToId) {
      const original = await this.messagesRepository.findById(replyToId);
      // Never let a reply quote a message from another room
      if (!original || original.roomId !== roomId) {
        throw new BadRequestException('Cannot reply to that message');
      }
    }
    return this.messagesRepository.create(
      userId,
      roomId,
      this.sanitize(text),
      replyToId,
    );
  }

  async editMessage(
    messageId: string,
    userId: string,
    roomId: string,
    text: string,
  ) {
    const message = await this.messagesRepository.findById(messageId);
    if (!message || message.roomId !== roomId) {
      throw new NotFoundException('Message not found');
    }
    if (message.userId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    const sanitized = this.sanitize(text).trim();
    if (!sanitized) throw new BadRequestException('Message cannot be empty');
    return this.messagesRepository.updateText(messageId, sanitized);
  }

  async getMessagesForRoom(
    roomId: string,
    cursor?: string,
    limit: number = 50,
  ) {
    return this.messagesRepository.findManyByRoom(roomId, cursor, limit);
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
