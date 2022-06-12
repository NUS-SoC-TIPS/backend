import { Injectable } from '@nestjs/common';
import { QuestionSubmission, Window } from '@prisma/client';

import { SubmissionWithQuestion } from '../interfaces/interface';
import { PrismaService } from '../prisma/prisma.service';
import { WindowsService } from '../windows/windows.service';

import { CreateSubmissionDto } from './dtos/create-submission.dto';
import { SubmissionsQueryBuilder } from './builders';
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
    return this.prismaService.questionSubmission.create({
      data: {
        ...createSubmissionDto,
        userId,
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
