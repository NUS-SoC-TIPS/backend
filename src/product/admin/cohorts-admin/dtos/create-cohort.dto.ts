import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCohortDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  coursemologyUrl: string;
}
