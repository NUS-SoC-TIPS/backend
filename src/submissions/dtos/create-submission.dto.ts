import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { Language, QuestionSource } from '../../prisma/generated';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  questionSlug: string;

  @IsEnum(QuestionSource)
  @IsNotEmpty()
  questionSource: QuestionSource;

  @IsEnum(Language)
  @IsNotEmpty()
  languageUsed: Language;

  @IsString()
  @IsNotEmpty()
  codeWritten: string;
}
