import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Trims the value; an empty string clears the field. */
const trimToNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Andrew Y.',
    description: 'Name shown instead of the username. Empty string clears it.',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  displayName?: string | null;

  @ApiPropertyOptional({
    example: 'Backend developer from Kyiv',
    description: 'Short "about me" text. Empty string clears it.',
  })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(160)
  bio?: string | null;
}
