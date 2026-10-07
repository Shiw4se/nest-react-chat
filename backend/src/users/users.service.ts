import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../auth/user.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  AVATAR_MIME_TYPES,
  AvatarStorageService,
} from './avatar-storage.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly avatarStorage: AvatarStorageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findProfileById(userId);
    if (!user) throw new NotFoundException('User not found');
    const { _count, ...profile } = user;
    return {
      ...profile,
      stats: {
        rooms: _count.rooms,
        ownedRooms: _count.ownedRooms,
        messages: _count.messages,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: { displayName?: string | null; bio?: string | null } = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.bio !== undefined) data.bio = dto.bio;
    return this.userRepository.updateProfile(userId, data);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!AVATAR_MIME_TYPES.includes(file.mimetype))
      throw new BadRequestException('Only JPEG, PNG, WebP or GIF images');

    const previous = await this.userRepository.findAvatarUrl(userId);
    const url = await this.avatarStorage.save(userId, file.buffer);
    const updated = await this.userRepository.updateAvatar(userId, url);
    await this.avatarStorage.remove(previous);
    return updated;
  }

  async removeAvatar(userId: string) {
    const previous = await this.userRepository.findAvatarUrl(userId);
    const updated = await this.userRepository.updateAvatar(userId, null);
    await this.avatarStorage.remove(previous);
    return updated;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    // 400, not 401: the client treats any 401 as an expired session and logs out
    if (!isMatch)
      throw new BadRequestException('Current password is incorrect');

    if (currentPassword === newPassword)
      throw new BadRequestException(
        'New password must differ from the current one',
      );

    const hash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(userId, hash);
    return { message: 'Password changed' };
  }
}
