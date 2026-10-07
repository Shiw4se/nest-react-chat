import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsRepository } from './rooms.repository';
import { CachedRoomsRepository } from './cached-rooms.repository';
import { ROOMS_REPOSITORY } from './rooms.tokens';

@Module({
  imports: [PrismaModule],
  controllers: [RoomsController],
  providers: [
    RoomsRepository,
    CachedRoomsRepository,
    { provide: ROOMS_REPOSITORY, useExisting: CachedRoomsRepository },
    RoomsService,
  ],
  exports: [RoomsService],
})
export class RoomsModule {}
