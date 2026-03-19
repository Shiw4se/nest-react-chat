import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [ConfigModule, AuthModule, MessagesModule, RoomsModule],
  providers: [ChatGateway],
})
export class ChatModule {}
