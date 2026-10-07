import { IsUUID } from 'class-validator';

export class UserParamDto {
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId: string;
}
