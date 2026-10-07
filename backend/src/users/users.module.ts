import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AvatarStorageService } from './avatar-storage.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, AvatarStorageService],
})
export class UsersModule {}
