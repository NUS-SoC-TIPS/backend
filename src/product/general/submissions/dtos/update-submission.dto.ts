import { IsEnum, IsOptional, IsString } from 'class-validator';

import { Language } from '../../../../infra/prisma/generated';

export class UpdateSubmissionDto {
  @IsEnum(Language)
  @IsOptional()
  languageUsed?: Language;

  @IsString()
  @IsOptional()
  codeWritten?: string;
}
