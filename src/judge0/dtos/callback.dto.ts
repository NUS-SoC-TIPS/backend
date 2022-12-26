import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class CallbackStatusDto {
  @IsNumber()
  id: number;

  @IsString()
  description: string;
}

export class CallbackDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @ValidateIf((_, value) => value !== null)
  stdout: string | null;

  @IsString()
  @ValidateIf((_, value) => value !== null)
  stderr: string | null;

  // Defined if compilation error
  @IsString()
  @ValidateIf((_, value) => value !== null)
  compile_output: string | null;

  // Defined if internal error
  @IsString()
  @ValidateIf((_, value) => value !== null)
  message: string | null;

  @IsNumber()
  @ValidateIf((_, value) => value !== null)
  time: number | null;

  @IsNumber()
  @ValidateIf((_, value) => value !== null)
  memory: number | null;

  @ValidateNested()
  status: CallbackStatusDto;
}
