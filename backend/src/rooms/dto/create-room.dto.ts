import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RoomType } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsEnum(RoomType)
  type: RoomType;
}