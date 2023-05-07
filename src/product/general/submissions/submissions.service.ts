import { Injectable, Logger } from '@nestjs/common';

import { SubmissionWithQuestion } from '../../../infra/interfaces/interface';
import { QuestionSubmission, Window } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { WindowsService } from '../../../windows/windows.service';

import { SubmissionsQueryBuilder } from './builders';
import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import { SubmissionStatsEntity } from './entities';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly windowsService: WindowsService,
    private readonly queryBuilder: SubmissionsQueryBuilder,
  ) {}

  create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<QuestionSubmission> {
    createSubmissionDto.codeWritten = createSubmissionDto.codeWritten.trim();
    return this.prismaService.questionSubmission
      .create({
        data: {
          ...createSubmissionDto,
          userId,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to create new submission for user with ID: ${userId}`,
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
  }

  async update(
    submissionId: number,
    updateSubmissionDto: UpdateSubmissionDto,
    userId: string,
  ): Promise<QuestionSubmission> {
    const submission = await this.prismaService.questionSubmission
      .findUniqueOrThrow({
        where: {
          id: submissionId,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find non-null submission with ID: ${submissionId}`,
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
    if (submission.userId !== userId) {
      // We won't differentiate on the client-side
      throw new Error('Unauthorized access');
    }
    if (updateSubmissionDto.codeWritten) {
      updateSubmissionDto.codeWritten = updateSubmissionDto.codeWritten.trim();
    }
    return this.prismaService.questionSubmission
      .update({
        where: {
          id: submissionId,
        },
        data: {
          ...updateSubmissionDto,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to update submission with ID: ${submissionId}`,
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
  }

  async findStats(userId: string): Promise<SubmissionStatsEntity> {
    // Finding window may throw. We will not catch here and instead let the
    // controller handle it.
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    const before = ongoingWindow?.endAt;
    const after =
      ongoingWindow?.startAt ?? this.windowsService.findStartOfWeek();
    const numberOfSubmissionsForThisWindowOrWeek = await this.queryBuilder
      .reset()
      .forUser(userId)
      .createdBefore(before)
      .createdAfter(after)
      .count()
      .catch((e) => {
        this.logger.error(
          'Failed to count number of submissions for this window or week',
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
    const latestSubmission = await this.queryBuilder
      .reset()
      .forUser(userId)
      .latest()
      .catch((e) => {
        this.logger.error(
          'Failed to find latest submission',
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
    const closestWindow = await this.windowsService.findClosestWindow();
    const allSubmissions = await this.queryBuilder
      .reset()
      .forUser(userId)
      .withLatestFirst()
      .query()
      .catch((e) => {
        this.logger.error(
          'Failed to find all submissions',
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
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
      .query()
      .catch((e) => {
        this.logger.error(
          'Failed to find submissions within window',
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
  }
}
