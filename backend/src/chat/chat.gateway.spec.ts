import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from '../messages/messages.service';
import { ChatEvents } from './enums/chat-events.enum';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let messagesService: MessagesService;

  const mockMessagesService = {
    createMessage: jest.fn(),
    deleteMessage: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockAuthenticatedSocket = {
    id: 'test-socket-id',
    user: { sub: 'user-123', username: 'Andrew' },
    handshake: {
      auth: { token: 'mock-token' },
      headers: { authorization: 'Bearer mock-token' }
    },
    join: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: MessagesService, useValue: mockMessagesService },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            verifyAsync: jest.fn().mockReturnValue({ sub: 'user-123', username: 'Andrew' }),
            sign: jest.fn()
          }
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    messagesService = module.get<MessagesService>(MessagesService);
    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection / handleDisconnect', () => {
    it('should log on connection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await gateway.handleConnection(mockAuthenticatedSocket as any);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Client authenticated'));
      consoleSpy.mockRestore();
    });

    it('should log on disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      gateway.handleDisconnect(mockAuthenticatedSocket as any);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Client disconnected'));
      consoleSpy.mockRestore();
    });
  });

  describe('handleJoinRoom', () => {
    it('should join the room and emit "User Joined"', () => {
      const data = { room: 'general', username: 'Andrew' };

      gateway.handleJoinRoom(data, mockAuthenticatedSocket);

      expect(mockAuthenticatedSocket.join).toHaveBeenCalledWith('general');
      expect(mockAuthenticatedSocket.to).toHaveBeenCalledWith('general');

      expect(mockAuthenticatedSocket.emit).toHaveBeenCalledWith(ChatEvents.USER_JOINED, {
        message: 'User Andrew has joined room',
      });
    });
  });

  describe('handleMessage', () => {
    it('should save message via service and emit to the room', async () => {
      const data = { room: 'general', message: 'Hello logic!' };
      const mockSavedMessage = {
        id: 'msg-1',
        message: data.message,
        room: data.room,
        user: { username: 'Andrew' },
      };

      mockMessagesService.createMessage.mockResolvedValue(mockSavedMessage);

      await gateway.handleMessage(data as any, mockAuthenticatedSocket);

      expect(messagesService.createMessage).toHaveBeenCalledWith(
        'user-123',
        'general',
        'Hello logic!'
      );

      expect(mockServer.to).toHaveBeenCalledWith('general');
      expect(mockServer.emit).toHaveBeenCalledWith(ChatEvents.NEW_MESSAGE, mockSavedMessage);
    });
  });
});