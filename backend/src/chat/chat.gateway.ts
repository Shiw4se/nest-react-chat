import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from "@nestjs/websockets";
import{ Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";

import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { PrismaService } from "../prisma/prisma.service";

interface AuthPayload {
  sub: string;
  username: string;
}

interface AuthenticatedSocket extends Socket {
  user: AuthPayload;
}

@UseGuards(WsJwtGuard) 
@WebSocketGateway({ 
  cors: {
    origin: "*",
  },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    // handle new connection
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // handle disconnection
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join")
  HandleJoinRoom(
    @MessageBody() data: {room: string, username: string}, 
    @ConnectedSocket() client: AuthenticatedSocket
) :void{
    const { username } = client.user;
    client.join(data.room);
    console.log(`${username} joined room ${data.room}`);
    client.to(data.room)
    .emit("User Joined",
      {message: `User ${username} has joined room`});
  }
    
  
  @SubscribeMessage("SendMessage")
  async handleMessage(
    @MessageBody() data: {room: string, message: string}, 
    @ConnectedSocket() client: AuthenticatedSocket
) {

    const {sub: userId } = client.user;
    if(!userId) {
      console.error("Unauthorized: No user ID found in socket");
      return;
    }
    try{
    const savedMessage = await this.prisma.message.create({
      data: {
       message: data.message,
        room: data.room,
        user:{connect: { id: userId } }
      },
      include: {
        user: {
          select: {username: true }
      }

      },

    });
    this.server.to(data.room).emit("newMessage", savedMessage);
    console.log(`Message saved and sent to room ${data.room}`);
  } catch (error) {
    console.error("Error saving message:", error);
  }
}
}

