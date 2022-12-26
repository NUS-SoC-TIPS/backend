import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class CallbackStatusDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
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

  @Transform((params) =>
    params.value !== null ? parseFloat(params.value) : null,
  )
  @IsNumber()
  @ValidateIf((_, value) => value !== null)
  time: number | null;

  @Transform((params) =>
    params.value !== null ? parseFloat(params.value) : null,
  )
  @IsNumber()
  @ValidateIf((_, value) => value !== null)
  memory: number | null;

  @ValidateNested()
  status: CallbackStatusDto;
}
