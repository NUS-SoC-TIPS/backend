import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuestionSubmission } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubmissionData: UpdateSubmissionDto,
    @GetUserRest('id') userId: string,
  ): Promise<QuestionSubmission> {
    return this.submissionsService.update(+id, updateSubmissionData, userId);
  }

  @Get('stats')
  async findStats(
    @GetUserRest('id') userId: string,
  ): Promise<SubmissionStatsEntity> {
    return this.submissionsService.findStats(userId);
  }
}
