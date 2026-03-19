import { IsUUID } from 'class-validator';

export class DeleteMessageDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId: string;

  @IsUUID('4', { message: 'messageId must be a valid UUID' })
  messageId: string;
}
