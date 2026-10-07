import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Public profile fields. Never includes the password hash. */
const PROFILE_SELECT = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
} as const;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /** Includes the password hash; only for credential checks. */
  async findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findProfileById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...PROFILE_SELECT,
        _count: { select: { rooms: true, messages: true, ownedRooms: true } },
      },
    });
  }

  async create(username: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        username,
        password: passwordHash,
      },
    });
  }

  async updateProfile(
    id: string,
    data: { displayName?: string | null; bio?: string | null },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: PROFILE_SELECT,
    });
  }

  async findAvatarUrl(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true },
    });
    return user?.avatarUrl ?? null;
  }

  async updateAvatar(id: string, avatarUrl: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: PROFILE_SELECT,
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }
}
