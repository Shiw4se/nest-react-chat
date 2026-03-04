import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@ApiTags('Messages')
@ApiBearerAuth()
@Controller({ path: 'messages', version: '1' })
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':room')
  @ApiOperation({ summary: 'Get message history for a specific room' })
  @ApiParam({ name: 'room', example: 'general', description: 'Chat room name' })
  @ApiResponse({ status: 200, description: 'Returns an array of messages' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getRoomMessages(@Param('room') room: string) {
    return this.messagesService.getMessagesForRoom(room);
  }
}