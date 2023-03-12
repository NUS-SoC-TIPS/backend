import { Injectable } from '@nestjs/common';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

import { Language, QuestionSource } from '../../prisma/generated';

@Injectable()
export class CreateRecordDto {
  @IsBoolean()
  @IsNotEmpty()
  isRoleplay: boolean;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  roomId: number;

  @IsEnum(Language)
  @IsNotEmpty()
  language: Language;

  @IsString()
  @IsNotEmpty()
  codeWritten: string;

  @IsBoolean()
  @IsOptional()
  isSolved?: boolean;

  @IsString()
  @IsOptional()
  questionId?: string;

  @IsEnum(QuestionSource)
  @IsOptional()
  questionSource?: QuestionSource;

  @IsArray({ each: true })
  roomRecordUsers: CreateRoomRecordUserDto[];
}

class CreateRoomRecordUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  @IsNotEmpty()
  isInterviewer: boolean;

  @IsString()
  @IsNotEmpty()
  notes: string;
}
