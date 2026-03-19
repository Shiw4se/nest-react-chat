import { IsUUID, IsNotEmpty, IsBoolean } from 'class-validator';

export class TypingDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  @IsNotEmpty()
  roomId: string;

  @IsBoolean()
  isTyping: boolean;
}
