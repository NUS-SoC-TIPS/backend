import { IsEnum, IsString } from 'class-validator';

import { ExcuseFrom, ExcuseStatus } from '../../../../infra/prisma/generated';

export class UpdateExcuseDto {
  @IsString()
  reason: string;

  @IsEnum(ExcuseFrom)
  excuseFrom: ExcuseFrom;

  @IsEnum(ExcuseStatus)
  status: ExcuseStatus;
}
