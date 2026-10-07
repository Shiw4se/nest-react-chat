import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ example: 'Andrew', description: 'Username to invite' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;
}
