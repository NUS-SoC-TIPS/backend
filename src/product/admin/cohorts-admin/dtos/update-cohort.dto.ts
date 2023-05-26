import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCohortDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  coursemologyUrl: string;
}
