import { Language } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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
