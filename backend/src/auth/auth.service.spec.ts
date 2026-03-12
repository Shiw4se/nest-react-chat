/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-misused-promises, @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;

  const mockUserRepository = {
    findByUsername: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock_jwt_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);
      await expect(
        authService.login('wrong_user', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return a token for valid credentials', async () => {
      const mockUser = {
        id: 'user-id-123',
        username: 'andrew_test',
        password: 'hashed_password',
      };
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await authService.login('andrew_test', 'password123');

      expect(result).toEqual({
        accessToken: 'mock_jwt_token',
        user: {
          id: 'user-id-123',
          username: 'andrew_test',
        },
      });
      expect(userRepository.findByUsername).toHaveBeenCalledWith('andrew_test');
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if user already exists', async () => {
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 'existing-id',
        username: 'andrew_test',
      });
      await expect(
        authService.register('andrew_test', 'password123'),
      ).rejects.toThrow(Error);
    });

    it('should hash password and return user without password', async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password_123');

      const newUser = {
        id: 'new-user-id',
        username: 'andrew_new',
        password: 'hashed_password_123',
      };
      mockUserRepository.create.mockResolvedValue(newUser);

      const result = await authService.register('andrew_new', 'password123');

      expect(result).toEqual({
        id: 'new-user-id',
        username: 'andrew_new',
      });
      expect(userRepository.create).toHaveBeenCalled();
    });
  });
});
