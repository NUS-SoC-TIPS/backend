import { Language } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  questionSlug: string;

  @IsEnum(Language)
  @IsNotEmpty()
  languageUsed: Language;

  @IsString()
  @IsNotEmpty()
  codeWritten: string;
}
