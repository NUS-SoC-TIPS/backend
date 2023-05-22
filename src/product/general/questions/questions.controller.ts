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
import {
  QuestionListItem,
  SubmissionItem,
  SubmissionListItem,
} from '../../interfaces';

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
  findAll(): Promise<QuestionListItem[]> {
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
  ): Promise<{ id: number }> {
    this.logger.log('POST /questions/submissions', QuestionsController.name);
    return this.questionsService.createSubmission(dto, userId);
  }

  @Get('submissions')
  @UseFilters(BadRequestExceptionFilter)
  findSubmissions(
    @GetUserRest('id') userId: string,
  ): Promise<SubmissionListItem[]> {
    this.logger.log('GET /questions/submissions', QuestionsController.name);
    return this.questionsService.findSubmissions(userId);
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
  ): Promise<{ codeWritten: string }> {
    this.logger.log(
      'PATCH questions/submissions/:id',
      QuestionsController.name,
    );
    return this.questionsService.updateSubmission(+id, dto, userId);
  }
}
