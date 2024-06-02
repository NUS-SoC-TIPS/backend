import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateCohortDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_host: true,
    host_whitelist: ['coursemology.org'],
  })
  coursemologyUrl: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail({ host_whitelist: ['googlegroups.com'] })
  email: string;
}
