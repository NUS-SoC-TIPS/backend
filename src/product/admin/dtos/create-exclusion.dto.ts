import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateExclusionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  windowId: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
