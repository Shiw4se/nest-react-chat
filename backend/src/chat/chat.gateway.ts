import { MessageBody, SubscribeMessage, WebSocketGateway,
   WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from "@nestjs/websockets";
import{ Server, Socket } from "socket.io";

@WebSocketGateway({ 
  cors: {
    origin: "*",
  },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

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
    @ConnectedSocket() client: Socket
) :void{
    client.join(data.room);
    console.log(`${data.username} joined room ${data.room}`);
    client.to(data.room)
    .emit("User Joined",{message: `User ${data.username} has joined room`});
  }
    
  
  @SubscribeMessage("SendMessage")
  handleMessage(
    @MessageBody() data: {room: string, username: string, message: string}, 
    @ConnectedSocket() client: Socket
) :void{
    console.log(`Message from ${data.username} in room ${data.room}: ${data.message}`);
    this.server.to(data.room)
    .emit("ReceiveMessage", {username: data.username, message: data.message});
  }
}

