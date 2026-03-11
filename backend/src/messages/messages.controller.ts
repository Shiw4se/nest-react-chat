import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomAccessGuard } from '../rooms/guards/room-access.guard';
import { RoomParamDto, PaginationQueryDto } from './dto/get-messages.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller({ path: 'messages', version: '1' })
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':roomId')
  @UseGuards(RoomAccessGuard)
  @ApiOperation({
    summary: 'Get message history for a specific room with pagination',
  })
  async getRoomMessages(
    @Request() req,
    @Param() params: RoomParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.messagesService.getMessagesForRoom(
      params.roomId,
      query.cursor,
      query.limit,
    );
  }
}
