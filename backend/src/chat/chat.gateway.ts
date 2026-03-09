import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from '@nestjs/jwt';
import { ChatEvents } from "./enums/chat-events.enum";
import { MessagesService } from "../messages/messages.service";
import { SendMessageDto } from "src/messages/dto/send-message.dto";

interface AuthPayload {
  sub: string;
  username: string;
}

interface AuthenticatedSocket extends Socket {
  user: AuthPayload;
}

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new Error('No token provided');
      }

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
  handleJoinRoom(
    @MessageBody() data: { room: string, username: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ): void {
    const { username } = client.user;
    client.join(data.room);
    console.log(`${username} joined room ${data.room}`);

    client.to(data.room).emit(ChatEvents.USER_JOINED, { message: `User ${username} has joined room` });
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    const { sub: userId } = client.user;

    try {
      const savedMessage = await this.messagesService.createMessage(userId, data.room, data.message);

      this.server.to(data.room).emit(ChatEvents.NEW_MESSAGE, savedMessage);
      console.log(`Message saved and sent to room ${data.room}`);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }

  @SubscribeMessage(ChatEvents.TYPING)
  handleTyping(
    @MessageBody() data: { room: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    const { username } = client.user;

    client.to(data.room).emit(ChatEvents.USER_TYPING, {
      username,
      isTyping: data.isTyping
    });
  }

  @SubscribeMessage(ChatEvents.DELETE_MESSAGE)
  async handleDeleteMessage(
    @MessageBody() data: { room: string; messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { sub: userId } = client.user;

      await this.messagesService.deleteMessage(data.messageId, userId);

      this.server.to(data.room).emit(ChatEvents.DELETE_MESSAGE, { messageId: data.messageId });
    } catch (error) {
      client.emit('ERROR', { message: error.message });
    }
  }
}