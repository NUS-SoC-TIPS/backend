import { Body, Controller, Logger, Put, UseFilters } from '@nestjs/common';

import { CallbackDto } from '../../../productinfra/judge0/dtos';
import { BadRequestExceptionFilter } from '../../../utils';

import { CodeGateway } from './code.gateway';

@Controller('code')
export class CodeController {
  constructor(
    private readonly logger: Logger,
    private readonly codeGateway: CodeGateway,
  ) {}

  @Put('callback')
  @UseFilters(BadRequestExceptionFilter)
  executionCallback(@Body() dto: CallbackDto): void {
    this.logger.log(
      `PUT /code/callback, token: ${dto.token}`,
      CodeController.name,
    );
    this.codeGateway.completeExecution(dto);
  }
}
