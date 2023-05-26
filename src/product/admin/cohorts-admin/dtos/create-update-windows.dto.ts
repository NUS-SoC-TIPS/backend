import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class CreateUpdateWindowsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUpdateWindowDto)
  windows: CreateUpdateWindowDto[];
}

class CreateUpdateWindowDto {
  @IsNumber()
  @IsOptional()
  id: number | null;

  @IsNumber()
  @IsNotEmpty()
  numQuestions: number;

  @IsBoolean()
  @IsNotEmpty()
  requireInterview: boolean;

  @IsDate()
  @IsNotEmpty()
  startAt: Date;

  @IsDate()
  @IsNotEmpty()
  endAt: Date;
}
