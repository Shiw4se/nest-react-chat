import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');


describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock_jwt_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

     
      await expect(authService.login('wrong_user', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return a token for valid credentials', async () => {
     
      const mockUser = {
        id: 'user-id-123',
        username: 'andrew_test',
        password: 'hashed_password', 
      };


      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await authService.login('andrew_test', 'password123');

        expect(result).toEqual({ 
        access_token: 'mock_jwt_token',
        user: {
            id: 'user-id-123',
            username: 'andrew_test',
        }
        });  
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'andrew_test' },
      });
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ 
        id: 'existing-id', 
        username: 'andrew_test' 
      });

      await expect(authService.register('andrew_test', 'password123')).rejects.toThrow(
        Error 
      );
    });

    it('should hash password and return token for a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_123');

      const newUser = {
        id: 'new-user-id',
        username: 'andrew_new',
        password: 'hashed_password_123',
      };
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await authService.register('andrew_new', 'password123');

     expect(result).toEqual({
        id: 'new-user-id',
        username: 'andrew_new',
      });

      expect(prismaService.user.create).toHaveBeenCalled();
    });
  });
 });