/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-misused-promises */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserRepository } from '../auth/user.repository';
import { AvatarStorageService } from './avatar-storage.service';
import { PresenceService } from '../realtime/presence.service';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findProfileById: jest.fn(),
    findByIdWithPassword: jest.fn(),
    updateProfile: jest.fn(),
    updatePassword: jest.fn(),
    findAvatarUrl: jest.fn(),
    updateAvatar: jest.fn(),
  };

  const mockAvatarStorage = {
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AvatarStorageService, useValue: mockAvatarStorage },
        PresenceService,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('flattens counts into stats', async () => {
      mockUserRepository.findProfileById.mockResolvedValue({
        id: 'u1',
        username: 'ann',
        displayName: null,
        bio: null,
        createdAt: new Date('2026-01-01'),
        _count: { rooms: 3, ownedRooms: 1, messages: 42 },
      });

      const result = await service.getProfile('u1');

      expect(result).not.toHaveProperty('_count');
      expect(result.stats).toEqual({ rooms: 3, ownedRooms: 1, messages: 42 });
    });

    it('throws when the user does not exist', async () => {
      mockUserRepository.findProfileById.mockResolvedValue(null);
      await expect(service.getProfile('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('only sends fields that were provided', async () => {
      await service.updateProfile('u1', { bio: 'hi' });
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith('u1', {
        bio: 'hi',
      });
    });

    it('passes null through to clear a field', async () => {
      await service.updateProfile('u1', { displayName: null });
      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith('u1', {
        displayName: null,
      });
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      mockUserRepository.findByIdWithPassword.mockResolvedValue({
        id: 'u1',
        password: 'old-hash',
      });
    });

    it('rejects a wrong current password', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      await expect(
        service.changePassword('u1', 'wrong1234', 'NewPass123'),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects reusing the same password', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      await expect(
        service.changePassword('u1', 'Same1234', 'Same1234'),
      ).rejects.toThrow(BadRequestException);
    });

    it('hashes and stores the new password', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      await service.changePassword('u1', 'OldPass123', 'NewPass456');

      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        'u1',
        'new-hash',
      );
    });
  });

  describe('uploadAvatar', () => {
    const file = (mimetype: string) =>
      ({ mimetype, buffer: Buffer.from('img') }) as Express.Multer.File;

    it('rejects a missing file', async () => {
      await expect(service.uploadAvatar('u1', undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects non-image types before touching storage', async () => {
      await expect(
        service.uploadAvatar('u1', file('application/pdf')),
      ).rejects.toThrow(BadRequestException);
      expect(mockAvatarStorage.save).not.toHaveBeenCalled();
    });

    it('stores the new avatar and deletes the previous one', async () => {
      mockUserRepository.findAvatarUrl.mockResolvedValue(
        '/uploads/avatars/old.webp',
      );
      mockAvatarStorage.save.mockResolvedValue('/uploads/avatars/new.webp');
      mockUserRepository.updateAvatar.mockResolvedValue({ id: 'u1' });

      await service.uploadAvatar('u1', file('image/png'));

      expect(mockUserRepository.updateAvatar).toHaveBeenCalledWith(
        'u1',
        '/uploads/avatars/new.webp',
      );
      expect(mockAvatarStorage.remove).toHaveBeenCalledWith(
        '/uploads/avatars/old.webp',
      );
    });
  });

  describe('removeAvatar', () => {
    it('clears the field and deletes the file', async () => {
      mockUserRepository.findAvatarUrl.mockResolvedValue(
        '/uploads/avatars/a.webp',
      );

      await service.removeAvatar('u1');

      expect(mockUserRepository.updateAvatar).toHaveBeenCalledWith('u1', null);
      expect(mockAvatarStorage.remove).toHaveBeenCalledWith(
        '/uploads/avatars/a.webp',
      );
    });
  });
});
