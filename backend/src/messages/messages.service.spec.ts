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
        { id: 'msg-1', message: 'First', room: 'general', user: { username: 'andrew_test' } },
        { id: 'msg-2', message: 'Second', room: 'general', user: { username: 'andrew_test' } },
      ];

      mockMessagesRepository.findManyByRoom.mockResolvedValue(mockMessages);

      const result = await messagesService.getMessagesForRoom('general');

      expect(result).toEqual(mockMessages);
    });
  });
});