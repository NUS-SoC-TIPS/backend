import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { QuestionSubmission, Window } from '@prisma/client';

import { SubmissionWithQuestion } from '../interfaces/interface';
import { PrismaService } from '../prisma/prisma.service';
import { WindowsService } from '../windows/windows.service';

import { SubmissionsQueryBuilder } from './builders';
import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import { SubmissionStatsEntity } from './entities';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly windowsService: WindowsService,
    private readonly queryBuilder: SubmissionsQueryBuilder,
  ) {}

  create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<QuestionSubmission> {
    createSubmissionDto.codeWritten = createSubmissionDto.codeWritten.trim();
    return this.prismaService.questionSubmission.create({
      data: {
        ...createSubmissionDto,
        userId,
      },
    });
  }

  async update(
    submissionId: number,
    updateSubmissionDto: UpdateSubmissionDto,
    userId: string,
  ): Promise<QuestionSubmission> {
    const submission = await this.prismaService.questionSubmission.findUnique({
      where: {
        id: submissionId,
      },
    });
    if (submission == null) {
      throw new BadRequestException();
    }
    if (submission.userId !== userId) {
      throw new UnauthorizedException();
    }
    if (updateSubmissionDto.codeWritten) {
      updateSubmissionDto.codeWritten = updateSubmissionDto.codeWritten.trim();
    }
    return this.prismaService.questionSubmission.update({
      where: {
        id: submissionId,
      },
      data: {
        ...updateSubmissionDto,
      },
    });
  }

  async findStats(userId: string): Promise<SubmissionStatsEntity> {
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    const before = ongoingWindow?.endAt;
    const after =
      ongoingWindow?.startAt ?? this.windowsService.findStartOfWeek();
    const numberOfSubmissionsForThisWindowOrWeek = await this.queryBuilder
      .reset()
      .forUser(userId)
      .createdBefore(before)
      .createdAfter(after)
      .count();
    const latestSubmission = await this.queryBuilder
      .reset()
      .forUser(userId)
      .latest();
    const closestWindow = await this.windowsService.findClosestWindow();
    const allSubmissions = await this.queryBuilder
      .reset()
      .forUser(userId)
      .withLatestFirst()
      .query();
    return {
      closestWindow,
      numberOfSubmissionsForThisWindowOrWeek,
      latestSubmission,
      allSubmissions,
    };
  }

  findWithinWindow(
    userId: string,
    window: Window,
  ): Promise<SubmissionWithQuestion[]> {
    return this.queryBuilder
      .reset()
      .forUser(userId)
      .createdBefore(window.endAt)
      .createdAfter(window.startAt)
      .withLatestFirst()
      .query();
  }
}
