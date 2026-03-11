import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { AuthenticatedSocket } from '../interfaces/auth.interfaces';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<AuthenticatedSocket>();

      const authHeader = client.handshake.headers?.authorization;
      const token =
        (client.handshake.auth?.token as string) || authHeader?.split(' ')[1];

      if (!token) {
        throw new WsException('Unauthorized');
      }

      const payload = await this.jwtService.verifyAsync<{
        id: string;
        username: string;
      }>(token, {
        secret: process.env.JWT_SECRET,
      });

      client.user = payload;
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
