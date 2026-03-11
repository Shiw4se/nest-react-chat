import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [AuthModule, MessagesModule, RoomsModule],
  providers: [ChatGateway],
})
export class ChatModule {}
