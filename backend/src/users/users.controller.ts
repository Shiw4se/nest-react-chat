import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AVATAR_MAX_BYTES } from './avatar-storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/auth.interfaces';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserParamDto } from './dto/user-param.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Own profile with stats' })
  getMe(@Request() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update display name and bio' })
  updateMe(@Request() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Patch('me/password')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Change password (requires the current one)' })
  changePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('me/avatar')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
    }),
  )
  @ApiOperation({ summary: 'Upload an avatar (JPEG/PNG/WebP/GIF, max 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  uploadAvatar(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.usersService.uploadAvatar(req.user.userId, file);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove the avatar' })
  removeAvatar(@Request() req: RequestWithUser) {
    return this.usersService.removeAvatar(req.user.userId);
  }

  // Declared after `me` routes so "me" is never parsed as a user id
  @Get(':userId')
  @ApiOperation({ summary: 'Public profile of another user' })
  getUser(@Param() params: UserParamDto) {
    return this.usersService.getProfile(params.userId);
  }
}
