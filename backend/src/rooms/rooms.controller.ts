import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Request() req, @Body() createRoomDto: CreateRoomDto) {
    const userId = req.user.sub || req.user.id; 
    return this.roomsService.create(userId, createRoomDto);
  }

  @Get('my')
  getMyRooms(@Request() req) {
    const userId = req.user.sub || req.user.id;
    return this.roomsService.getMyRooms(userId);
  }

  @Get('public')
  getPublicRooms() {
    return this.roomsService.getPublicRooms();
  }

  @Post('join/:token')
  joinByToken(@Request() req, @Param('token') token: string) {
    const userId = req.user.sub || req.user.id;
    return this.roomsService.joinByToken(userId, token);
  }
}