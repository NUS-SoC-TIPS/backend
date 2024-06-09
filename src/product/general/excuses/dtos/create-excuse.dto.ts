import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

import { ExcuseFrom } from '../../../../infra/prisma/generated';

export class CreateExcuseDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsEnum(ExcuseFrom)
  @IsNotEmpty()
  excuseFrom: ExcuseFrom;

  @IsNumber()
  @IsNotEmpty()
  windowId: number;

  @IsNumber()
  @IsNotEmpty()
  studentId: number;
}
