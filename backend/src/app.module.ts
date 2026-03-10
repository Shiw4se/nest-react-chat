import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; 
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    ChatModule ,
    AuthModule, 
    MessagesModule, 
    PrismaModule, RoomsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}