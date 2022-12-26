import { Body, Controller, Put } from '@nestjs/common';

import { CallbackDto } from '../judge0/dtos';

import { CodeGateway } from './code.gateway';

@Controller('code')
export class CodeController {
  constructor(private readonly codeGateway: CodeGateway) {}

  @Put('callback')
  executionCallback(@Body() dto: CallbackDto): void {
    this.codeGateway.completeExecution(dto);
  }
}
