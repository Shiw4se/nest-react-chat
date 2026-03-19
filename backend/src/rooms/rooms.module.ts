import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoomsRepository } from './rooms.repository';
import { CachedRoomsRepository } from './cached-rooms.repository';

export const ROOMS_REPOSITORY = 'ROOMS_REPOSITORY';

@Module({
  imports: [PrismaModule],
  controllers: [RoomsController],
  providers: [
    RoomsRepository,
    CachedRoomsRepository,
    { provide: ROOMS_REPOSITORY, useClass: CachedRoomsRepository },
    RoomsService,
  ],
  exports: [RoomsService],
})
export class RoomsModule {}