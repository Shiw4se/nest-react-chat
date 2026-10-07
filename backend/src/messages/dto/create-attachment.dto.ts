import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * Multipart text fields that accompany an uploaded chat image. The file
 * itself is read by FileInterceptor and documented with @ApiBody on the
 * controller: declaring it here would make it an own property (class fields
 * are defined even when unset) and forbidNonWhitelisted would reject it.
 */
export class CreateAttachmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  caption?: string;

  @IsOptional()
  @IsUUID('4')
  replyToId?: string;
}
