import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { QuestionSubmission } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { SubmissionStatsEntity } from './entities';
import { SubmissionsService } from './submissions.service';

@UseGuards(JwtRestGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<QuestionSubmission> {
    return this.submissionsService.create(createSubmissionDto, userId);
  }

  @Get('stats')
  async findStats(
    @GetUserRest('id') userId: string,
  ): Promise<SubmissionStatsEntity> {
    return this.submissionsService.findStats(userId);
  }
}
