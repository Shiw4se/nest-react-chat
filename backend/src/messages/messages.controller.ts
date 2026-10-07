import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import type { RequestWithUser } from '../auth/interfaces/auth.interfaces';
import { RoomsService } from '../rooms/rooms.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ChatEvents } from '../chat/enums/chat-events.enum';
import { ATTACHMENT_MAX_BYTES } from '../storage/image-storage.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomAccessGuard } from '../rooms/guards/room-access.guard';
import { RoomParamDto, PaginationQueryDto } from './dto/get-messages.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller({ path: 'messages', version: '1' })
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Images go over HTTP (multipart) rather than the socket; the saved
   * message is then pushed to the room exactly like a text message.
   */
  @Post(':roomId/attachments')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: ATTACHMENT_MAX_BYTES, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG, WebP or GIF, max 10 MB',
        },
        caption: { type: 'string', maxLength: 4000 },
        replyToId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOperation({ summary: 'Send an image (optional caption and reply)' })
  async sendAttachment(
    @Request() req: RequestWithUser,
    @Param() params: RoomParamDto,
    @Body() body: CreateAttachmentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const userId = req.user.userId;
    if (!(await this.roomsService.isMember(userId, params.roomId))) {
      throw new ForbiddenException('Join the room first');
    }

    const message = await this.messagesService.createImageMessage(
      userId,
      params.roomId,
      file,
      body.caption,
      body.replyToId,
    );
    this.realtime.toRoom(params.roomId, ChatEvents.NEW_MESSAGE, message);
    await this.roomsService.notifyActivity(params.roomId, userId, message);
    return message;
  }

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
