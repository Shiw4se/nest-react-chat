import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { RoomAccessGuard } from '../rooms/guards/room-access.guard';

describe('MessagesController', () => {
  let controller: MessagesController;

  const mockMessagesService = {
    getMessagesForRoom: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockMessagesService }],
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
});
