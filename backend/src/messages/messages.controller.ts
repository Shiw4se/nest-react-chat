import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomParamDto, PaginationQueryDto } from './dto/get-messages.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller({ path: 'messages', version: '1' })
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Get(':room')
  @ApiOperation({ summary: 'Get message history for a specific room with pagination' })
  async getRoomMessages(
    @Param() params: RoomParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.messagesService.getMessagesForRoom(params.room, query.cursor, query.limit);
  }
}