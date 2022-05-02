import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  githubUsername: string;

  @IsUrl()
  @IsNotEmpty()
  photoUrl: string;

  @IsUrl()
  @IsNotEmpty()
  profileUrl: string;
}
