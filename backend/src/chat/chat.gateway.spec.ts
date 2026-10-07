/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from '../messages/messages.service';
import { RoomsService } from '../rooms/rooms.service';
import { ChatEvents } from './enums/chat-events.enum';
import { UserRepository } from '../auth/user.repository';
import { PresenceService } from '../realtime/presence.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let messagesService: MessagesService;
  let roomsService: RoomsService;

  const mockMessagesService = {
    createMessage: jest.fn(),
    deleteMessage: jest.fn(),
  };

  const mockRoomsService = {
    joinRoom: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockUserRepository = { touchLastSeen: jest.fn() };

  const mockAuthenticatedSocket = {
    id: 'test-socket-id',
    user: { id: 'user-123', username: 'Andrew' },
    handshake: {
      auth: { token: 'mock-token' },
      headers: { authorization: 'Bearer mock-token' },
    },
    join: jest.fn(),
    leave: jest.fn(),
    rooms: new Set(['test-socket-id']),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    broadcast: { emit: jest.fn() },
    data: {},
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: RoomsService, useValue: mockRoomsService },
        { provide: UserRepository, useValue: mockUserRepository },
        PresenceService,
        RealtimeService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            verifyAsync: jest
              .fn()
              .mockResolvedValue({ id: 'user-123', username: 'Andrew' }),
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    messagesService = module.get<MessagesService>(MessagesService);
    roomsService = module.get<RoomsService>(RoomsService);
    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('presence', () => {
    beforeEach(() => {
      mockAuthenticatedSocket.data = {};
    });

    it('joins the personal channel and announces the user as online', async () => {
      await gateway.handleConnection(mockAuthenticatedSocket);

      expect(mockAuthenticatedSocket.join).toHaveBeenCalledWith(
        'user:user-123',
      );
      expect(mockAuthenticatedSocket.broadcast.emit).toHaveBeenCalledWith(
        ChatEvents.PRESENCE,
        { userId: 'user-123', online: true },
      );
      expect(mockAuthenticatedSocket.emit).toHaveBeenCalledWith(
        ChatEvents.PRESENCE_SNAPSHOT,
        { online: ['user-123'] },
      );
      await gateway.handleDisconnect(mockAuthenticatedSocket);
    });

    it('stores lastSeenAt and announces offline after the last socket', async () => {
      await gateway.handleConnection(mockAuthenticatedSocket);
      await gateway.handleDisconnect(mockAuthenticatedSocket);

      expect(mockUserRepository.touchLastSeen).toHaveBeenCalledWith(
        'user-123',
        expect.any(Date),
      );
      expect(mockServer.emit).toHaveBeenCalledWith(
        ChatEvents.PRESENCE,
        expect.objectContaining({ userId: 'user-123', online: false }),
      );
    });

    it('rejects a connection without a token', async () => {
      const anonymous = {
        ...mockAuthenticatedSocket,
        handshake: { auth: {}, headers: {} },
        disconnect: jest.fn(),
      };
      await gateway.handleConnection(anonymous);
      expect(anonymous.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoinRoom', () => {
    it('should leave old rooms, check access, join new room and emit "User Joined"', async () => {
      const data = { roomId: 'room-123' };

      mockAuthenticatedSocket.rooms = new Set([
        'test-socket-id',
        'user:user-123',
        'old-room',
      ]);
      mockAuthenticatedSocket.data = { roomId: 'old-room' };

      mockRoomsService.joinRoom.mockResolvedValue(true);

      await gateway.handleJoinRoom(data, mockAuthenticatedSocket);

      expect(mockAuthenticatedSocket.leave).toHaveBeenCalledWith('old-room');
      expect(mockAuthenticatedSocket.leave).not.toHaveBeenCalledWith(
        'user:user-123',
      );
      expect(mockRoomsService.joinRoom).toHaveBeenCalledWith(
        'user-123',
        'room-123',
      );
      expect(mockAuthenticatedSocket.join).toHaveBeenCalledWith('room-123');
      expect(mockAuthenticatedSocket.to).toHaveBeenCalledWith('room-123');
      expect(mockAuthenticatedSocket.emit).toHaveBeenCalledWith(
        ChatEvents.USER_JOINED,
        {
          message: 'User Andrew has joined room',
        },
      );
    });

    it('should block access and emit ERROR if user is not in RoomMember table', async () => {
      const data = { roomId: 'room-123' };

      mockRoomsService.joinRoom.mockResolvedValue(false);
      mockAuthenticatedSocket.rooms = new Set(['test-socket-id']);

      await gateway.handleJoinRoom(data, mockAuthenticatedSocket);

      expect(mockAuthenticatedSocket.join).not.toHaveBeenCalled();
      expect(mockAuthenticatedSocket.emit).toHaveBeenCalledWith('ERROR', {
        message: 'Forbidden: You are not a member of this room',
      });
    });
  });

  describe('handleMessage', () => {
    it('should save message via service and emit to the room', async () => {
      const data = { roomId: 'room-123', message: 'Hello logic!' };

      mockAuthenticatedSocket.rooms = new Set(['test-socket-id', 'room-123']);

      const mockSavedMessage = {
        id: 'msg-1',
        message: data.message,
        roomId: data.roomId,
        user: { username: 'Andrew' },
      };

      mockMessagesService.createMessage.mockResolvedValue(mockSavedMessage);

      await gateway.handleMessage(data as any, mockAuthenticatedSocket);

      expect(messagesService.createMessage).toHaveBeenCalledWith(
        'user-123',
        'room-123',
        'Hello logic!',
      );

      expect(mockServer.to).toHaveBeenCalledWith('room-123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        ChatEvents.NEW_MESSAGE,
        mockSavedMessage,
      );
    });
  });
});
