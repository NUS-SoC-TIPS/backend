import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { QuestionSubmission } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { CreateSubmissionDto } from './dtos/create-submission.dto';
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
}
