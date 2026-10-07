import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class EditMessageDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId: string;

  @IsUUID('4', { message: 'messageId must be a valid UUID' })
  messageId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message: string;
}
