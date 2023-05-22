import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { GetUserRest } from '../../../productinfra/decorators';
import { JwtRestGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';
import { QuestionBase, SubmissionItem } from '../../interfaces';

import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import { QuestionStats } from './questions.interfaces';
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
  findAll(): Promise<QuestionBase[]> {
    this.logger.log('GET /questions', QuestionsController.name);
    return this.questionsService.findAllQuestions();
  }

  @Get('stats')
  @UseFilters(BadRequestExceptionFilter)
  findStats(@GetUserRest('id') userId: string): Promise<QuestionStats> {
    this.logger.log('GET /questions/stats', QuestionsController.name);
    return this.questionsService.findStats(userId);
  }

  @Post('submissions')
  @UseFilters(BadRequestExceptionFilter)
  createSubmission(
    @Body() dto: CreateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<void> {
    this.logger.log('POST /questions/submissions', QuestionsController.name);
    return this.questionsService.createSubmission(dto, userId);
  }

  @Get('submissions/:id')
  @UseFilters(BadRequestExceptionFilter)
  findSubmission(
    @Param('id') id: string,
    @GetUserRest('id') userId: string,
  ): Promise<SubmissionItem> {
    this.logger.log('GET /questions/submissions/:id', QuestionsController.name);
    return this.questionsService.findSubmission(+id, userId);
  }

  @Patch('submissions/:id')
  updateSubmission(
    @Param('id') id: string,
    @Body() dto: UpdateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<void> {
    this.logger.log(
      'PATCH questions/submissions/:id',
      QuestionsController.name,
    );
    return this.questionsService.updateSubmission(+id, dto, userId);
  }
}
