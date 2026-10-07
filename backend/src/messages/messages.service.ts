import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { MessagesRepository } from './messages.repository';
import { ImageStorageService } from '../storage/image-storage.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly images: ImageStorageService,
  ) {}

  private sanitize(text: string) {
    return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
  }

  async createMessage(
    userId: string,
    roomId: string,
    text: string,
    replyToId?: string,
  ) {
    await this.assertReplyTarget(roomId, replyToId);
    return this.messagesRepository.create(
      userId,
      roomId,
      this.sanitize(text),
      replyToId,
    );
  }

  /** Never let a reply quote a message from another room */
  private async assertReplyTarget(roomId: string, replyToId?: string) {
    if (!replyToId) return;
    const original = await this.messagesRepository.findById(replyToId);
    if (!original || original.roomId !== roomId) {
      throw new BadRequestException('Cannot reply to that message');
    }
  }

  async createImageMessage(
    userId: string,
    roomId: string,
    file: Express.Multer.File | undefined,
    caption = '',
    replyToId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    this.images.assertImageType(file.mimetype);
    await this.assertReplyTarget(roomId, replyToId);

    const image = await this.images.saveAttachment(userId, file.buffer);
    try {
      return await this.messagesRepository.createWithAttachment(
        userId,
        roomId,
        this.sanitize(caption).trim(),
        image,
        replyToId,
      );
    } catch (error) {
      // Do not leave an orphaned file behind if the message was not saved
      await this.images.remove(image.url);
      throw error;
    }
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
    // A photo may lose its caption; a text message may not become empty
    if (!sanitized && !message.attachmentUrl) {
      throw new BadRequestException('Message cannot be empty');
    }
    return this.messagesRepository.updateText(messageId, sanitized);
  }

  async getMessagesForRoom(
    roomId: string,
    cursor?: string,
    limit: number = 50,
  ) {
    return this.messagesRepository.findManyByRoom(roomId, cursor, limit);
  }

  async toggleReaction(
    messageId: string,
    userId: string,
    roomId: string,
    emoji: string,
  ) {
    const message = await this.messagesRepository.findById(messageId);
    if (!message || message.roomId !== roomId) {
      throw new NotFoundException('Message not found');
    }
    return this.messagesRepository.toggleReaction(messageId, userId, emoji);
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
    await this.images.remove(message.attachmentUrl);

    return messageId;
  }
}
