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

import { QuestionSubmission } from '../../../infra/prisma/generated';
import { BadRequestExceptionFilter } from '../../../utils';
import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import { SubmissionStatsEntity } from './entities';
import { SubmissionsService } from './submissions.service';

@UseGuards(JwtRestGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(
    private readonly logger: Logger,
    private readonly submissionsService: SubmissionsService,
  ) {}

  @Post()
  @UseFilters(BadRequestExceptionFilter)
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<QuestionSubmission> {
    this.logger.log('POST /submissions', SubmissionsController.name);
    return this.submissionsService.create(createSubmissionDto, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubmissionData: UpdateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<QuestionSubmission> {
    this.logger.log('PATCH /submissions/:id', SubmissionsController.name);
    return this.submissionsService.update(+id, updateSubmissionData, userId);
  }

  @Get('stats')
  @UseFilters(BadRequestExceptionFilter)
  async findStats(
    @GetUserRest('id') userId: string,
  ): Promise<SubmissionStatsEntity> {
    this.logger.log('GET /submissions/stats', SubmissionsController.name);
    return this.submissionsService.findStats(userId);
  }
}
