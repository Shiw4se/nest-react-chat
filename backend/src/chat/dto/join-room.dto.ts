import { IsUUID, IsNotEmpty } from 'class-validator';

export class JoinRoomDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  @IsNotEmpty()
  roomId: string;
}
