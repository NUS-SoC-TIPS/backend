import { Controller, Get, Logger, UseFilters, UseGuards } from '@nestjs/common';

import { Question } from '../../../infra/prisma/generated';
import { BadRequestExceptionFilter } from '../../../utils';
import { JwtRestGuard } from '../auth/guards';

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
