import { IsIn, IsUUID } from 'class-validator';
import { ALLOWED_REACTIONS } from '../../messages/reactions';

export class ToggleReactionDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId: string;

  @IsUUID('4', { message: 'messageId must be a valid UUID' })
  messageId: string;

  @IsIn(ALLOWED_REACTIONS, { message: 'Unsupported reaction' })
  emoji: string;
}
