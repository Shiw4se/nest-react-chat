import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MessagesService', () => {
  let messagesService: MessagesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    message: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    messagesService = module.get<MessagesService>(MessagesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(messagesService).toBeDefined();
  });

  describe('getMessagesForRoom', () => {
    it('should return an array of messages for a specific room', async () => {
      const mockMessagesList = [
        { id: 'msg-1', content: 'Hi', room: 'general', user: { username: 'andrew_test' } },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(mockMessagesList);

      const result = await messagesService.getMessagesForRoom('general');

      expect(result).toEqual(mockMessagesList);
      
      expect(prismaService.message.findMany).toHaveBeenCalledWith({
        where: { room: 'general' },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { username: true } } },
      });
    });
  });
});