import { IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  githubUsername: string;

  @IsString()
  coursemologyName: string;

  @IsString()
  coursemologyProfileUrl: string;
}
