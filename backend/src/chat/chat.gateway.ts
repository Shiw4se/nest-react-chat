import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatEvents } from './enums/chat-events.enum';
import { MessagesService } from '../messages/messages.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { TypingDto } from './dto/typing.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { RoomsService } from '../rooms/rooms.service';
import { UserRepository } from '../auth/user.repository';
import { PresenceService } from '../realtime/presence.service';
import { RealtimeService, userChannel } from '../realtime/realtime.service';
import type { AuthenticatedSocket } from '../auth/interfaces/auth.interfaces';

// CORS origin is set dynamically in afterInit() via ConfigService
// so that process.env is read after dotenv has been loaded by ConfigModule
@WebSocketGateway()
// Global pipes from main.ts do not apply to gateways, so validation is attached here.
// Invalid payloads are turned into a WsException, which Nest delivers to the client
// as an `exception` event instead of crashing the handler.
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) =>
      new WsException(
        errors.flatMap((e) => Object.values(e.constraints ?? {})).join('; ') ||
          'Validation failed',
      ),
  }),
)
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly userRepository: UserRepository,
    private readonly presence: PresenceService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    server.engine.opts.cors = { origin: frontendUrl, credentials: true };
    this.realtime.attach(server);
  }

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers?.authorization;
      const token =
        (client.handshake.auth?.token as string) || authHeader?.split(' ')[1];

      if (!token) throw new Error('No token provided');

      const payload = await this.jwtService.verifyAsync<
        AuthenticatedSocket['user']
      >(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const socket = client as AuthenticatedSocket;
      socket.user = payload;

      // Personal channel: lets the server reach every tab of this user
      await socket.join(userChannel(payload.id));

      if (this.presence.connect(payload.id, socket.id)) {
        socket.broadcast.emit(ChatEvents.PRESENCE, {
          userId: payload.id,
          online: true,
        });
      }
      socket.emit(ChatEvents.PRESENCE_SNAPSHOT, {
        online: this.presence.onlineUserIds(),
      });

      this.logger.log(
        `Client authenticated: ${payload.username} (${client.id})`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Connection rejected for ${client.id}: ${errorMessage}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = (client as AuthenticatedSocket).user;
    this.logger.log(`Client disconnected: ${client.id}`);
    if (!user || !this.presence.disconnect(user.id, client.id)) return;

    const lastSeenAt = new Date();
    try {
      await this.userRepository.touchLastSeen(user.id, lastSeenAt);
    } catch (error) {
      this.logger.warn(
        `Could not store lastSeenAt for ${user.id}: ${String(error)}`,
      );
    }
    this.server.emit(ChatEvents.PRESENCE, {
      userId: user.id,
      online: false,
      lastSeenAt: lastSeenAt.toISOString(),
    });
  }

  /** Leaves the chat room this socket is viewing, keeping its personal channel. */
  private async leaveActiveRoom(client: AuthenticatedSocket) {
    const current = client.data.roomId;
    if (current) {
      await client.leave(current);
      client.data.roomId = undefined;
    }
  }

  @SubscribeMessage(ChatEvents.JOIN)
  async handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const { id: userId, username } = client.user;

    await this.leaveActiveRoom(client);

    const hasAccess = await this.roomsService.joinRoom(userId, data.roomId);

    if (!hasAccess) {
      client.emit(ChatEvents.ERROR, {
        message: 'Forbidden: You are not a member of this room',
      });
      return;
    }

    await client.join(data.roomId);
    client.data.roomId = data.roomId;
    this.logger.log(`${username} joined room ${data.roomId}`);

    client.to(data.roomId).emit(ChatEvents.USER_JOINED, {
      message: `User ${username} has joined room`,
    });
  }

  @SubscribeMessage(ChatEvents.LEAVE)
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await this.leaveActiveRoom(client);
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { id: userId } = client.user;

    if (!client.rooms.has(data.roomId)) {
      client.emit(ChatEvents.ERROR, {
        message: 'Forbidden: join the room first',
      });
      return;
    }

    try {
      const savedMessage = await this.messagesService.createMessage(
        userId,
        data.roomId,
        data.message,
      );

      this.server.to(data.roomId).emit(ChatEvents.NEW_MESSAGE, savedMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error saving message: ${errorMessage}`);
      client.emit(ChatEvents.ERROR, { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage(ChatEvents.TYPING)
  handleTyping(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { username } = client.user;

    client.to(data.roomId).emit(ChatEvents.USER_TYPING, {
      username,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage(ChatEvents.DELETE_MESSAGE)
  async handleDeleteMessage(
    @MessageBody() data: DeleteMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.rooms.has(data.roomId)) {
      client.emit(ChatEvents.ERROR, {
        message: 'Forbidden: join the room first',
      });
      return;
    }

    try {
      const { id: userId } = client.user;

      await this.messagesService.deleteMessage(data.messageId, userId);

      this.server
        .to(data.roomId)
        .emit(ChatEvents.DELETE_MESSAGE, { messageId: data.messageId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete message';
      client.emit(ChatEvents.ERROR, { message: errorMessage });
    }
  }
}
