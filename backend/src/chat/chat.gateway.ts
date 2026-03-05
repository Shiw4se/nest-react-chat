import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from '@nestjs/jwt'; 
import { PrismaService } from "../prisma/prisma.service";
import { ChatEvents } from "./enums/chat-events.enum"; 

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
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

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
  HandleJoinRoom(
    @MessageBody() data: {room: string, username: string}, 
    @ConnectedSocket() client: AuthenticatedSocket
  ): void {
    const { username } = client.user;
    client.join(data.room);
    console.log(`${username} joined room ${data.room}`);
    
    client.to(data.room).emit(ChatEvents.USER_JOINED, { message: `User ${username} has joined room` });
  }
    
  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleMessage(
    @MessageBody() data: {room: string, message: string}, 
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    const { sub: userId } = client.user; 
    
    try {
      const savedMessage = await this.prisma.message.create({
        data: {
          message: data.message,
          room: data.room,
          user: { connect: { id: userId } }
        },
        include: {
          user: { select: { username: true } }
        },
      });
      
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
}