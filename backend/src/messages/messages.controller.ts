import { Controller, Get, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { RoomsService } from '../rooms/rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomParamDto, PaginationQueryDto } from './dto/get-messages.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller({ path: 'messages', version: '1' })
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
  ) { }

  @Get(':roomId')
  @ApiOperation({ summary: 'Get message history for a specific room with pagination' })
  async getRoomMessages(
    @Request() req,
    @Param() params: RoomParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    const userId = req.user.userId;

    const hasAccess = await this.roomsService.checkRoomAccess(userId, params.roomId);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to read messages in this room');
    }

    return this.messagesService.getMessagesForRoom(params.roomId, query.cursor, query.limit);
  }
}