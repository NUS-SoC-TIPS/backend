import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuestionSubmission } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';
import { handleRestError } from '../utils/error.util';

import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import { SubmissionStatsEntity } from './entities';
import { SubmissionsService } from './submissions.service';

@UseGuards(JwtRestGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly submissionsService: SubmissionsService,
    private readonly logger: Logger,
  ) {}

  @Post()
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<QuestionSubmission> {
    this.logger.log('POST /submissions', SubmissionsController.name);
    return this.submissionsService
      .create(createSubmissionDto, userId)
      .catch(handleRestError());
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubmissionData: UpdateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<QuestionSubmission> {
    this.logger.log('PATCH /submissions/:id', SubmissionsController.name);
    return this.submissionsService
      .update(+id, updateSubmissionData, userId)
      .catch(handleRestError());
  }

  @Get('stats')
  async findStats(
    @GetUserRest('id') userId: string,
  ): Promise<SubmissionStatsEntity> {
    this.logger.log('GET /submissions/stats', SubmissionsController.name);
    return this.submissionsService.findStats(userId).catch(handleRestError());
  }
}
