import { Controller, Get, Logger, UseFilters, UseGuards } from '@nestjs/common';
import { Question } from '@prisma/client';

import { JwtRestGuard } from '../auth/guards';
import { BadRequestExceptionFilter } from '../utils';

import { QuestionsService } from './questions.service';

@UseGuards(JwtRestGuard)
@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly logger: Logger,
  ) {}

  @Get()
  @UseFilters(BadRequestExceptionFilter)
  findAll(): Promise<Question[]> {
    this.logger.log('GET /questions', QuestionsController.name);
    return this.questionsService.findAll();
  }
}
