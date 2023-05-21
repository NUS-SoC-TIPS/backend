import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateExclusionDto {
  @IsNumber()
  @IsNotEmpty()
  studentId: number;

  @IsNumber()
  @IsNotEmpty()
  windowId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
