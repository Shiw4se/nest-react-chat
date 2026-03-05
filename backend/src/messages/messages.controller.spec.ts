import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockMessagesService = {
    getMessagesForRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMessages', () => {
    it('should call service.getMessagesForRoom with correct room', async () => {
      const room = 'general';
      const mockResult = [{ id: '1', content: 'test', room }];
      mockMessagesService.getMessagesForRoom.mockResolvedValue(mockResult);

      const result = await controller.getRoomMessages(room);

      expect(result).toEqual(mockResult);
      expect(service.getMessagesForRoom).toHaveBeenCalledWith(room, undefined, 50);
    });
  });
});