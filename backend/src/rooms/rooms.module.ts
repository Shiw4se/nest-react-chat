import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoomsRepository } from './rooms.repository';
import { CachedRoomsRepository } from './cached-rooms.repository';

@Module({
  imports: [PrismaModule],
  controllers: [RoomsController],
  providers: [RoomsRepository, CachedRoomsRepository, RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}