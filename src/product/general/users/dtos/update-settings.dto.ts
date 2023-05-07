import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { KeyBinding, Language } from '../../../../infra/prisma/generated';

export class UpdateSettingsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  photoUrl: string;

  @IsEnum(Language)
  @IsOptional()
  preferredInterviewLanguage?: Language;

  @IsEnum(KeyBinding)
  @IsNotEmpty()
  preferredKeyBinding: KeyBinding;
}
