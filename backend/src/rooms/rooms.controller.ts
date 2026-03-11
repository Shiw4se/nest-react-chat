import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    const userId = req.user.userId;
    return this.roomsService.create(userId, createRoomDto);
  }

  @Get('my')
  getMyRooms(@Request() req) {
    const userId = req.user.userId;
    return this.roomsService.getMyRooms(userId);
  }

  @Get('public')
  getPublicRooms() {
    return this.roomsService.getPublicRooms();
  }

  @Post('join/:token')
  joinByToken(@Request() req, @Param('token') token: string) {
    const userId = req.user.userId;
    return this.roomsService.joinByToken(userId, token);
  }

  @Get(':roomId/invite-token')
  getInviteToken(@Request() req, @Param('roomId') roomId: string) {
    const userId = req.user.userId;
    return this.roomsService.getInviteToken(userId, roomId);
  }

  @Post(':roomId/invite-user')
  inviteByUsername(
    @Request() req,
    @Param('roomId') roomId: string,
    @Body('username') username: string,
  ) {
    const userId = req.user.userId;
    return this.roomsService.inviteByUsername(userId, roomId, username);
  }

  @Patch(':roomId/invite-token')
  regenerateInviteToken(@Request() req, @Param('roomId') roomId: string) {
    const userId = req.user.userId;
    return this.roomsService.regenerateInviteToken(userId, roomId);
  }
}