import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Проверь путь к гарду

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':room')
  async getRoomMessages(@Param('room') room: string) {
    return this.messagesService.getMessagesForRoom(room);
  }
}