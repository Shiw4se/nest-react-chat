import { IsUUID } from 'class-validator';

export class RoomParamDto {
  @IsUUID('4', { message: 'roomId must be a valid UUID' })
  roomId: string;
}
