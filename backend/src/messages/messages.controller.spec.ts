/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { RoomAccessGuard } from '../rooms/guards/room-access.guard';
import { RoomsService } from '../rooms/rooms.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('MessagesController', () => {
  let controller: MessagesController;

  const mockMessagesService = {
    getMessagesForRoom: jest.fn().mockResolvedValue([]),
    createImageMessage: jest
      .fn()
      .mockResolvedValue({ id: 'm1', roomId: 'room-1' }),
  };
  const mockRoomsService = {
    isMember: jest.fn(),
    notifyActivity: jest.fn(),
  };
  const mockRealtime = { toRoom: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: RoomsService, useValue: mockRoomsService },
        { provide: RealtimeService, useValue: mockRealtime },
      ],
    })
      .overrideGuard(RoomAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoomMessages', () => {
    it('should return messages for a room', async () => {
      const mockReq = { user: { userId: 'user-123' } };
      const mockParams = { roomId: 'room-123' };
      const mockQuery = { cursor: undefined, limit: 50 };

      const result = await controller.getRoomMessages(
        mockReq,
        mockParams as any,
        mockQuery,
      );

      expect(mockMessagesService.getMessagesForRoom).toHaveBeenCalledWith(
        'room-123',
        undefined,
        50,
      );
      expect(result).toEqual([]);
    });
  });

  describe('sendAttachment', () => {
    const req = { user: { userId: 'u1' } } as any;
    const file = { mimetype: 'image/png', buffer: Buffer.from('x') } as any;

    it('refuses non-members', async () => {
      mockRoomsService.isMember.mockResolvedValue(false);
      await expect(
        controller.sendAttachment(req, { roomId: 'room-1' }, {}, file),
      ).rejects.toThrow('Join the room first');
      expect(mockMessagesService.createImageMessage).not.toHaveBeenCalled();
    });

    it('saves the image and pushes it to the room like a text message', async () => {
      mockRoomsService.isMember.mockResolvedValue(true);
      await controller.sendAttachment(
        req,
        { roomId: 'room-1' },
        { caption: 'hi' },
        file,
      );

      expect(mockRealtime.toRoom).toHaveBeenCalledWith('room-1', 'newMessage', {
        id: 'm1',
        roomId: 'room-1',
      });
      expect(mockRoomsService.notifyActivity).toHaveBeenCalledWith(
        'room-1',
        'u1',
        {
          id: 'm1',
          roomId: 'room-1',
        },
      );
    });
  });
});
