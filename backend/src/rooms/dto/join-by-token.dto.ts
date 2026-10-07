import { IsString, Length, Matches } from 'class-validator';

export class JoinByTokenDto {
  // 16 random bytes encoded as base64url
  @IsString()
  @Length(16, 64)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Invalid invite token format' })
  token: string;
}
