import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { ROOMS_REPOSITORY } from './rooms.tokens';
import { PrismaService } from '../prisma/prisma.service';

describe('RoomsService', () => {
  let service: RoomsService;

  const mockRoomsRepository = {
    create: jest.fn(),
    findMyRooms: jest.fn(),
    findPublicRooms: jest.fn(),
    findById: jest.fn(),
    findByInviteToken: jest.fn(),
    findMember: jest.fn(),
    addMember: jest.fn(),
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: ROOMS_REPOSITORY,
          useValue: mockRoomsRepository
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});