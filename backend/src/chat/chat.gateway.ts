import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatEvents } from './enums/chat-events.enum';
import { MessagesService } from '../messages/messages.service';
import { SendMessageDto } from '../messages/dto/send-message.dto';
import { RoomsService } from '../rooms/rooms.service';
import type { AuthenticatedSocket } from '../auth/interfaces/auth.interfaces';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers?.authorization;
      const token =
        (client.handshake.auth?.token as string) || authHeader?.split(' ')[1];

      if (!token) throw new Error('No token provided');

      const payload = await this.jwtService.verifyAsync<
        AuthenticatedSocket['user']
      >(token, {
        secret: process.env.JWT_SECRET,
      });

      (client as AuthenticatedSocket).user = payload;
      console.log(`Client authenticated: ${payload.username} (${client.id})`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Connection rejected for ${client.id}: ${errorMessage}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(ChatEvents.JOIN)
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    const { id: userId, username } = client.user;

    const currentRooms = Array.from(client.rooms);

    for (const room of currentRooms) {
      if (room !== client.id) {
        await client.leave(room);
      }
    }

    const hasAccess = await this.roomsService.checkRoomAccess(
      userId,
      data.roomId,
    );

    if (!hasAccess) {
      client.emit('ERROR', {
        message: 'Forbidden: You are not a member of this room',
      });
      return;
    }

    await client.join(data.roomId);
    console.log(`${username} securely joined room ${data.roomId}`);

    client.to(data.roomId).emit(ChatEvents.USER_JOINED, {
      message: `User ${username} has joined room`,
    });
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { id: userId } = client.user;

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
      console.error('Error saving message:', errorMessage);
      client.emit('ERROR', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage(ChatEvents.TYPING)
  handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
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
    @MessageBody() data: { roomId: string; messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { id: userId } = client.user;

      await this.messagesService.deleteMessage(data.messageId, userId);

      this.server
        .to(data.roomId)
        .emit(ChatEvents.DELETE_MESSAGE, { messageId: data.messageId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete message';
      client.emit('ERROR', { message: errorMessage });
    }
  }
}
