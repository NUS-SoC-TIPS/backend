import { Injectable } from '@nestjs/common';
import { QuestionSubmission } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSubmissionDto } from './dtos/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<QuestionSubmission> {
    return this.prismaService.questionSubmission.create({
      data: {
        ...createSubmissionDto,
        userId,
      },
    });
  }
}