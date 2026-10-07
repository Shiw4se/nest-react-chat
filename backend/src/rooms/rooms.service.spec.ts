import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { ROOMS_REPOSITORY } from './rooms.tokens';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../realtime/presence.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ChatEvents } from '../chat/enums/chat-events.enum';

describe('RoomsService', () => {
  let service: RoomsService;

  const mockRoomsRepository = {
    create: jest.fn(),
    findMyRooms: jest.fn(),
    findPublicRooms: jest.fn(),
    findById: jest.fn(),
    findByInviteToken: jest.fn(),
    findMember: jest.fn(),
    findMembers: jest.fn(),
    findMemberIds: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    delete: jest.fn(),
  };

  const mockRealtime = { toUser: jest.fn(), toUsers: jest.fn() };

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: ROOMS_REPOSITORY,
          useValue: mockRoomsRepository,
        },
        PresenceService,
        { provide: RealtimeService, useValue: mockRealtime },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('leaveRoom', () => {
    it('removes a regular member', async () => {
      mockRoomsRepository.findById.mockResolvedValue({
        id: 'room-1',
        ownerId: 'owner',
        type: 'PUBLIC',
      });
      mockRoomsRepository.findMember.mockResolvedValue({ userId: 'u1' });

      await service.leaveRoom('u1', 'room-1');

      expect(mockRoomsRepository.removeMember).toHaveBeenCalledWith(
        'u1',
        'room-1',
      );
    });

    it('rejects the owner', async () => {
      mockRoomsRepository.findById.mockResolvedValue({
        id: 'room-1',
        ownerId: 'owner',
        type: 'PUBLIC',
      });

      await expect(service.leaveRoom('owner', 'room-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRoomsRepository.removeMember).not.toHaveBeenCalled();
    });
  });

  describe('deleteRoom', () => {
    it('allows the owner', async () => {
      mockRoomsRepository.findById.mockResolvedValue({
        id: 'room-1',
        ownerId: 'owner',
      });

      mockRoomsRepository.findMemberIds.mockResolvedValue(['owner', 'u1']);

      await service.deleteRoom('owner', 'room-1');

      expect(mockRoomsRepository.delete).toHaveBeenCalledWith('room-1');
      expect(mockRealtime.toUsers).toHaveBeenCalledWith(
        ['owner', 'u1'],
        ChatEvents.ROOM_REMOVED,
        expect.objectContaining({ roomId: 'room-1', deletedBy: 'owner' }),
      );
    });

    it('rejects non-owners', async () => {
      mockRoomsRepository.findById.mockResolvedValue({
        id: 'room-1',
        ownerId: 'owner',
      });

      await expect(service.deleteRoom('u1', 'room-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getRoom', () => {
    it('returns members with owner flag and hides the invite token', async () => {
      mockRoomsRepository.findById.mockResolvedValue({
        id: 'room-1',
        name: 'Test',
        ownerId: 'owner',
        type: 'PRIVATE',
        inviteToken: 'secret',
      });
      mockRoomsRepository.findMember.mockResolvedValue({ userId: 'u1' });
      mockRoomsRepository.findMembers.mockResolvedValue([
        { joinedAt: new Date(), user: { id: 'owner', username: 'Boss' } },
        { joinedAt: new Date(), user: { id: 'u1', username: 'Ann' } },
      ]);

      const result = await service.getRoom('u1', 'room-1');

      expect(result).not.toHaveProperty('inviteToken');
      expect(result.members).toEqual([
        expect.objectContaining({ id: 'owner', isOwner: true }),
        expect.objectContaining({ id: 'u1', isOwner: false }),
      ]);
    });
  });

  describe('inviteByUsername', () => {
    it('adds the member and notifies them live', async () => {
      mockRoomsRepository.findById.mockResolvedValue({
        id: 'room-1',
        name: 'Team',
        ownerId: 'owner',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u2' });
      mockRoomsRepository.findMember.mockResolvedValue(null);

      await service.inviteByUsername('owner', 'room-1', 'bob');

      expect(mockRoomsRepository.addMember).toHaveBeenCalledWith(
        'u2',
        'room-1',
      );
      expect(mockRealtime.toUser).toHaveBeenCalledWith(
        'u2',
        ChatEvents.ROOM_ADDED,
        {
          roomId: 'room-1',
          roomName: 'Team',
        },
      );
    });
  });
});
