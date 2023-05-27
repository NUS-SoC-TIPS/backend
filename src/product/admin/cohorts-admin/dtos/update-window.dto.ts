import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateWindowDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsNumber()
  @IsNotEmpty()
  numQuestions: number;

  @IsBoolean()
  @IsNotEmpty()
  requireInterview: boolean;

  @IsString()
  @IsNotEmpty()
  startAt: string;

  @IsString()
  @IsNotEmpty()
  endAt: string;
}
