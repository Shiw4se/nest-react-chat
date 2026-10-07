import { IsString, IsUUID, MaxLength } from 'class-validator';

export class EditMessageDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId: string;

  @IsUUID('4', { message: 'messageId must be a valid UUID' })
  messageId: string;

  // May be empty for a photo caption; MessagesService rejects empty text messages
  @IsString()
  @MaxLength(10000)
  message: string;
}
