/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let messagesRepository: MessagesRepository;

  const mockMessagesRepository = {
    create: jest.fn(),
    findManyByRoom: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
    updateText: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: MessagesRepository, useValue: mockMessagesRepository },
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
});
