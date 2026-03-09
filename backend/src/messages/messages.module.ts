import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [PrismaModule], 
  providers: [MessagesService, MessagesRepository],
  controllers: [MessagesController],
  exports: [MessagesService] 
})
export class MessagesModule {}