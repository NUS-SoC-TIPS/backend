import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { Question } from '@prisma/client';
import { handleRestError } from 'src/utils/error.util';

import { JwtRestGuard } from '../auth/guards';

import { QuestionsService } from './questions.service';

@UseGuards(JwtRestGuard)
@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly logger: Logger,
  ) {}

  @Get()
  findAll(): Promise<Question[]> {
    this.logger.log('GET /questions', QuestionsController.name);
    return this.questionsService.findAll().catch(handleRestError());
  }
}
