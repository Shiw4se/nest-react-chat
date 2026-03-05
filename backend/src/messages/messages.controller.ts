import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@ApiTags('Messages')
@ApiBearerAuth()
@Controller({ path: 'messages', version: '1' })
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':room')
  @ApiOperation({ summary: 'Get message history for a specific room with pagination' })
  @ApiParam({ name: 'room', example: 'general', description: 'Chat room name' })
  @ApiQuery({ name: 'cursor', required: false, description: 'ID of the oldest message currently loaded', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of messages to fetch (default: 50)', type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Returns an array of messages' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getRoomMessages(
    @Param('room') room: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {  
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    
    return this.messagesService.getMessagesForRoom(room, cursor, parsedLimit);
  }
}