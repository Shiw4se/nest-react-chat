import { IsUUID, IsBoolean } from 'class-validator';

export class TypingDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId: string;

  @IsBoolean()
  isTyping: boolean;
}
