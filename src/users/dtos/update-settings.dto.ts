import { IsEnum, IsOptional, IsString } from 'class-validator';

import { Language } from '../../prisma/generated';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsEnum(Language)
  @IsOptional()
  preferredInterviewLanguage?: Language;
}
