import { IsBoolean, IsDate, IsNotEmpty, IsNumber } from 'class-validator';

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

  @IsDate()
  @IsNotEmpty()
  startAt: Date;

  @IsDate()
  @IsNotEmpty()
  endAt: Date;
}
