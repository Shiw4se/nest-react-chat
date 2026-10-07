/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { ImageStorageService } from '../storage/image-storage.service';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let messagesRepository: MessagesRepository;

  const mockMessagesRepository = {
    create: jest.fn(),
    findManyByRoom: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
    updateText: jest.fn(),
    toggleReaction: jest.fn(),
    createWithAttachment: jest.fn(),
  };

  const mockImages = {
    assertImageType: jest.fn(),
    saveAttachment: jest.fn().mockResolvedValue({
      url: '/uploads/attachments/x.webp',
      width: 10,
      height: 5,
    }),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: MessagesRepository, useValue: mockMessagesRepository },
        { provide: ImageStorageService, useValue: mockImages },
      ],
    }).compile();

    messagesService = module.get<MessagesService>(MessagesService);
    messagesRepository = module.get<MessagesRepository>(MessagesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(messagesService).toBeDefined();
  });

  describe('getMessagesForRoom', () => {
    it('should return messages for a specific room', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          message: 'First',
          room: 'general',
          user: { username: 'andrew_test' },
        },
        {
          id: 'msg-2',
          message: 'Second',
          room: 'general',
          user: { username: 'andrew_test' },
        },
      ];

      mockMessagesRepository.findManyByRoom.mockResolvedValue(mockMessages);

      const result = await messagesService.getMessagesForRoom('general');

      expect(result).toEqual(mockMessages);
    });
  });

  describe('replies', () => {
    it('rejects replying to a message from another room', async () => {
      mockMessagesRepository.findById.mockResolvedValue({
        id: 'm0',
        roomId: 'other',
      });
      await expect(
        messagesService.createMessage('u1', 'room-1', 'hi', 'm0'),
      ).rejects.toThrow('Cannot reply to that message');
      expect(mockMessagesRepository.create).not.toHaveBeenCalled();
    });

    it('stores the reply reference for a message in the same room', async () => {
      mockMessagesRepository.findById.mockResolvedValue({
        id: 'm0',
        roomId: 'room-1',
      });
      await messagesService.createMessage('u1', 'room-1', '<b>hi</b>', 'm0');
      expect(mockMessagesRepository.create).toHaveBeenCalledWith(
        'u1',
        'room-1',
        'hi',
        'm0',
      );
    });
  });

  describe('editMessage', () => {
    const own = { id: 'm1', roomId: 'room-1', userId: 'u1' };

    it('lets the author edit and sanitizes the text', async () => {
      mockMessagesRepository.findById.mockResolvedValue(own);
      await messagesService.editMessage('m1', 'u1', 'room-1', ' <i>fixed</i> ');
      expect(mockMessagesRepository.updateText).toHaveBeenCalledWith(
        'm1',
        'fixed',
      );
    });

    it("forbids editing someone else's message", async () => {
      mockMessagesRepository.findById.mockResolvedValue(own);
      await expect(
        messagesService.editMessage('m1', 'u2', 'room-1', 'x'),
      ).rejects.toThrow('You can only edit your own messages');
    });

    it('rejects text that is empty after sanitizing', async () => {
      mockMessagesRepository.findById.mockResolvedValue(own);
      await expect(
        messagesService.editMessage('m1', 'u1', 'room-1', '<script></script>'),
      ).rejects.toThrow('Message cannot be empty');
    });

    it('treats a message from another room as missing', async () => {
      mockMessagesRepository.findById.mockResolvedValue(own);
      await expect(
        messagesService.editMessage('m1', 'u1', 'room-2', 'x'),
      ).rejects.toThrow('Message not found');
    });
  });

  describe('toggleReaction', () => {
    it('toggles on a message in the same room', async () => {
      mockMessagesRepository.findById.mockResolvedValue({
        id: 'm1',
        roomId: 'room-1',
      });
      mockMessagesRepository.toggleReaction.mockResolvedValue([
        { emoji: '👍', userId: 'u1' },
      ]);

      const result = await messagesService.toggleReaction(
        'm1',
        'u1',
        'room-1',
        '👍',
      );

      expect(mockMessagesRepository.toggleReaction).toHaveBeenCalledWith(
        'm1',
        'u1',
        '👍',
      );
      expect(result).toEqual([{ emoji: '👍', userId: 'u1' }]);
    });

    it('refuses messages from another room', async () => {
      mockMessagesRepository.findById.mockResolvedValue({
        id: 'm1',
        roomId: 'room-2',
      });
      await expect(
        messagesService.toggleReaction('m1', 'u1', 'room-1', '👍'),
      ).rejects.toThrow('Message not found');
    });
  });

  describe('image messages', () => {
    const file = {
      mimetype: 'image/png',
      buffer: Buffer.from('img'),
    } as Express.Multer.File;

    it('stores the processed image with a sanitized caption', async () => {
      await messagesService.createImageMessage(
        'u1',
        'room-1',
        file,
        ' <b>Look</b> ',
      );
      expect(mockMessagesRepository.createWithAttachment).toHaveBeenCalledWith(
        'u1',
        'room-1',
        'Look',
        { url: '/uploads/attachments/x.webp', width: 10, height: 5 },
        undefined,
      );
    });

    it('removes the file if saving the message fails', async () => {
      mockMessagesRepository.createWithAttachment.mockRejectedValueOnce(
        new Error('db down'),
      );
      await expect(
        messagesService.createImageMessage('u1', 'room-1', file),
      ).rejects.toThrow('db down');
      expect(mockImages.remove).toHaveBeenCalledWith(
        '/uploads/attachments/x.webp',
      );
    });

    it('lets a photo caption be cleared', async () => {
      mockMessagesRepository.findById.mockResolvedValue({
        id: 'm1',
        roomId: 'room-1',
        userId: 'u1',
        attachmentUrl: '/uploads/attachments/x.webp',
      });
      await messagesService.editMessage('m1', 'u1', 'room-1', '');
      expect(mockMessagesRepository.updateText).toHaveBeenCalledWith('m1', '');
    });

    it('deletes the file together with the message', async () => {
      mockMessagesRepository.findById.mockResolvedValue({
        id: 'm1',
        roomId: 'room-1',
        userId: 'u1',
        attachmentUrl: '/uploads/attachments/x.webp',
      });
      await messagesService.deleteMessage('m1', 'u1');
      expect(mockImages.remove).toHaveBeenCalledWith(
        '/uploads/attachments/x.webp',
      );
    });
  });
});
