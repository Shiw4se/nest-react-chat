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

interface AuthPayload {
  sub: string;
  username: string;
}

interface AuthenticatedSocket extends Socket {
  user: AuthPayload;
}

@WebSocketGateway({
  cors: {
    origin: '*',
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
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) throw new Error('No token provided');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      (client as AuthenticatedSocket).user = payload;
      console.log(`Client authenticated: ${payload.username} (${client.id})`);
    } catch (error) {
      console.error(`Connection rejected for ${client.id}: ${error.message}`);
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
    const { sub: userId, username } = client.user;

    const currentRooms = Array.from(client.rooms);
    currentRooms.forEach((room) => {
      if (room !== client.id) client.leave(room);
    });

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

    client.join(data.roomId);
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
    const { sub: userId } = client.user;

    try {
      const savedMessage = await this.messagesService.createMessage(
        userId,
        data.roomId,
        data.message,
      );

      this.server.to(data.roomId).emit(ChatEvents.NEW_MESSAGE, savedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
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
      const { sub: userId } = client.user;

      await this.messagesService.deleteMessage(data.messageId, userId);

      this.server
        .to(data.roomId)
        .emit(ChatEvents.DELETE_MESSAGE, { messageId: data.messageId });
    } catch (error) {
      client.emit('ERROR', { message: error.message });
    }
  }
}
