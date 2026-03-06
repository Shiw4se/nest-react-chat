import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MessagesService } from 'src/messages/messages.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ChatGateway, MessagesService],
})
export class ChatModule { }