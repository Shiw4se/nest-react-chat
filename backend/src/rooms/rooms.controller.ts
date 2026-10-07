import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomParamDto } from './dto/room-param.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JoinByTokenDto } from './dto/join-by-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/auth.interfaces';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'rooms', version: '1' })
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a room (owner joins automatically)' })
  create(
    @Request() req: RequestWithUser,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomsService.create(req.user.userId, createRoomDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List rooms the current user is a member of' })
  getMyRooms(@Request() req: RequestWithUser) {
    return this.roomsService.getMyRooms(req.user.userId);
  }

  @Get('public')
  @ApiOperation({ summary: 'List public rooms' })
  getPublicRooms() {
    return this.roomsService.getPublicRooms();
  }

  @Post('join/:token')
  @ApiOperation({ summary: 'Join a private room by invite token' })
  joinByToken(
    @Request() req: RequestWithUser,
    @Param() params: JoinByTokenDto,
  ) {
    return this.roomsService.joinByToken(req.user.userId, params.token);
  }

  @Get(':roomId')
  @ApiOperation({ summary: 'Room details with member list' })
  getRoom(@Request() req: RequestWithUser, @Param() params: RoomParamDto) {
    return this.roomsService.getRoom(req.user.userId, params.roomId);
  }

  @Post(':roomId/leave')
  @ApiOperation({ summary: 'Leave a room (owners must delete instead)' })
  leaveRoom(@Request() req: RequestWithUser, @Param() params: RoomParamDto) {
    return this.roomsService.leaveRoom(req.user.userId, params.roomId);
  }

  @Delete(':roomId')
  @ApiOperation({ summary: 'Delete a room with its messages (owner only)' })
  deleteRoom(@Request() req: RequestWithUser, @Param() params: RoomParamDto) {
    return this.roomsService.deleteRoom(req.user.userId, params.roomId);
  }

  @Get(':roomId/invite-token')
  @ApiOperation({
    summary: 'Get the invite token of a private room (owner only)',
  })
  getInviteToken(
    @Request() req: RequestWithUser,
    @Param() params: RoomParamDto,
  ) {
    return this.roomsService.getInviteToken(req.user.userId, params.roomId);
  }

  @Post(':roomId/invite-user')
  @ApiOperation({ summary: 'Invite a user by username (owner only)' })
  inviteByUsername(
    @Request() req: RequestWithUser,
    @Param() params: RoomParamDto,
    @Body() body: InviteUserDto,
  ) {
    return this.roomsService.inviteByUsername(
      req.user.userId,
      params.roomId,
      body.username,
    );
  }

  @Patch(':roomId/invite-token')
  @ApiOperation({ summary: 'Regenerate the invite token (owner only)' })
  regenerateInviteToken(
    @Request() req: RequestWithUser,
    @Param() params: RoomParamDto,
  ) {
    return this.roomsService.regenerateInviteToken(
      req.user.userId,
      params.roomId,
    );
  }
}
