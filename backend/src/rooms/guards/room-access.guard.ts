import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RoomsService } from '../rooms.service';
import { RequestWithUser } from 'src/auth/interfaces/auth.interfaces';

@Injectable()
export class RoomAccessGuard implements CanActivate {
  constructor(private readonly roomsService: RoomsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const userId = request.user?.userId;
    const roomId = request.params?.roomId as string;

    if (!roomId) {
      return true;
    }

    if (!userId) {
      throw new ForbiddenException('User is not authenticated');
    }

    const hasAccess = await this.roomsService.checkRoomAccess(userId, roomId);

    if (!hasAccess) {
      throw new ForbiddenException(
        'You do not have access to read messages in this room',
      );
    }

    return true;
  }
}
