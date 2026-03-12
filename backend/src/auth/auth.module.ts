import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { UserRepository } from './user.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, UserRepository, JwtStrategy, WsJwtGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, WsJwtGuard],
})
export class AuthModule {}
