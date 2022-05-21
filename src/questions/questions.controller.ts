import { Controller, Get, UseGuards } from '@nestjs/common';
import { Question } from '@prisma/client';
import { JwtRestGuard } from 'src/auth/guards';

import { QuestionsService } from './questions.service';

@UseGuards(JwtRestGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(): Promise<Question[]> {
    return this.questionsService.findAll();
  }
}
