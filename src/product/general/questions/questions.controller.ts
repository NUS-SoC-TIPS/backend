import { Controller, Get, Logger, UseFilters, UseGuards } from '@nestjs/common';

import { Question } from '../../../infra/prisma/generated';
import { JwtRestGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { QuestionsService } from './questions.service';

@UseGuards(JwtRestGuard)
@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly logger: Logger,
    private readonly questionsService: QuestionsService,
  ) {}

  @Get()
  @UseFilters(BadRequestExceptionFilter)
  findAll(): Promise<Question[]> {
    this.logger.log('GET /questions', QuestionsController.name);
    return this.questionsService.findAll();
  }
}
