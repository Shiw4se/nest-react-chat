import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { RoomsService } from '../rooms/rooms.service';

describe('MessagesController', () => {
  let controller: MessagesController;

  const mockMessagesService = {
    getMessagesForRoom: jest.fn().mockResolvedValue([]),
  };

  const mockRoomsService = {
    checkRoomAccess: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: RoomsService, useValue: mockRoomsService },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoomMessages', () => {
    it('should return messages if user has access', async () => {
      const mockReq = { user: { userId: 'user-123' } };
      const mockParams = { roomId: 'room-123' };
      const mockQuery = { cursor: undefined, limit: 50 };

      const result = await controller.getRoomMessages(mockReq, mockParams as any, mockQuery);

      expect(mockRoomsService.checkRoomAccess).toHaveBeenCalledWith('user-123', 'room-123');
      expect(mockMessagesService.getMessagesForRoom).toHaveBeenCalledWith('room-123', undefined, 50);
      expect(result).toEqual([]);
    });
  });
});