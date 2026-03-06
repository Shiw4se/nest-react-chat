import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let prismaService: PrismaService;

  const mockPrismaService = {
    message: {
      create: jest.fn(),
    },
  };

  const mockMessagesService = {
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
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            verifyAsync: jest.fn().mockReturnValue({ sub: 'user-123', username: 'Andrew' }),
            sign: jest.fn()
          }
        },
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    prismaService = module.get<PrismaService>(PrismaService);

    gateway.server = mockServer as any;
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

  describe('HandleJoinRoom', () => {
    it('should join the room and emit "User Joined"', () => {
      const data = { room: 'general', username: 'Andrew' };

      gateway.HandleJoinRoom(data, mockAuthenticatedSocket);

      expect(mockAuthenticatedSocket.join).toHaveBeenCalledWith('general');
      expect(mockAuthenticatedSocket.to).toHaveBeenCalledWith('general');
      expect(mockAuthenticatedSocket.emit).toHaveBeenCalledWith('userJoined', {
        message: 'User Andrew has joined room',
      });
    });
  });

  describe('handleMessage', () => {
    it('should save message to Prisma and emit to the room', async () => {
      const data = { room: 'general', message: 'Hello logic!' };
      const mockSavedMessage = {
        id: 'msg-1',
        message: data.message,
        room: data.room,
        user: { username: 'Andrew' },
      };

      mockPrismaService.message.create.mockResolvedValue(mockSavedMessage);

      await gateway.handleMessage(data, mockAuthenticatedSocket);

      expect(prismaService.message.create).toHaveBeenCalledWith({
        data: {
          message: data.message,
          room: data.room,
          user: { connect: { id: 'user-123' } },
        },
        include: { user: { select: { username: true } } },
      });

      expect(mockServer.to).toHaveBeenCalledWith('general');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', mockSavedMessage);
    });
  });
});