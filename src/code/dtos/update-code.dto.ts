import { Injectable } from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';

@Injectable()
export class UpdateCodeDto {
  @IsArray()
  @IsString({ each: true })
  code: string[];
}
