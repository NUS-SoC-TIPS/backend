import { Body, Controller, Put } from '@nestjs/common';

import { CodeGateway } from './code.gateway';
import { CallbackDto } from './dtos';

@Controller('code')
export class CodeController {
  constructor(private readonly codeGateway: CodeGateway) {}

  @Put('callback')
  executionCallback(@Body() dto: CallbackDto): void {
    this.codeGateway.completeExecution(dto);
  }
}
