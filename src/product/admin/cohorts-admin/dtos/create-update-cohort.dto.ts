import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateUpdateCohortDto {
  @IsNumber()
  @IsOptional()
  id: number | null;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  coursemologyUrl: string;

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
