import { Language } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSubmissionDto {
  @IsEnum(Language)
  @IsOptional()
  languageUsed?: Language;

  @IsString()
  @IsOptional()
  codeWritten?: string;
}
