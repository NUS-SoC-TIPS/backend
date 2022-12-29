import { Body, Controller, Logger, Put } from '@nestjs/common';

import { CallbackDto } from '../judge0/dtos';

import { CodeGateway } from './code.gateway';

@Controller('code')
export class CodeController {
  constructor(
    private readonly codeGateway: CodeGateway,
    private readonly logger: Logger,
  ) {}

  @Put('callback')
  executionCallback(@Body() dto: CallbackDto): void {
    this.logger.log(
      `PUT /code/callback, token: ${dto.token}`,
      CodeController.name,
    );
    this.codeGateway.completeExecution(dto);
  }
}
