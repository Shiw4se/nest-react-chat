import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  message: string;
}
