import { Injectable, Logger } from '@nestjs/common';

import { QuestionSubmission } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ResultsService } from '../../../productinfra/results/results.service';
import { findStartOfWeek } from '../../../utils';
import { WindowsService } from '../../../windows/windows.service';

import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import { SubmissionStatsEntity } from './entities';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly resultsService: ResultsService,
    private readonly windowsService: WindowsService,
  ) {}

  async create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<QuestionSubmission> {
    createSubmissionDto.codeWritten = createSubmissionDto.codeWritten.trim();
    const submission = await this.prismaService.questionSubmission
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
    return this.resultsService.maybeMatchQuestionSubmission(submission, userId);
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
    const numberOfSubmissionsForThisWindowOrWeek = await this.countSubmissions(
      userId,
    );
    const latestSubmission = await this.prismaService.questionSubmission
      .findFirst({
        where: { userId },
        include: { question: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find latest submission',
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
    // TODO: Replace this stat with something more meaningful
    const closestWindow = await this.windowsService.findClosestWindow();
    const allSubmissions = await this.prismaService.questionSubmission
      .findMany({
        where: { userId },
        include: { question: true },
        orderBy: { createdAt: 'desc' },
      })
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

  private async countSubmissions(userId: string): Promise<number> {
    // Finding window may throw. We will not catch here and instead let the
    // controller handle it.
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    if (ongoingWindow != null) {
      const student = await this.prismaService.student
        .findUnique({
          where: {
            userId_cohortId: { userId, cohortId: ongoingWindow.cohortId },
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to find nullable student',
            e instanceof Error ? e.stack : undefined,
            SubmissionsService.name,
          );
          throw e;
        });
      if (student != null) {
        const studentRecord = await this.prismaService.studentResult
          .findUniqueOrThrow({
            where: {
              studentId_windowId: {
                studentId: student.id,
                windowId: ongoingWindow.id,
              },
            },
            include: { _count: { select: { questionSubmissions: true } } },
          })
          .catch((e) => {
            this.logger.error(
              'Failed to count number of submissions for this window',
              e instanceof Error ? e.stack : undefined,
              SubmissionsService.name,
            );
            throw e;
          });
        return studentRecord._count.questionSubmissions;
      }
    }
    return this.prismaService.questionSubmission
      .count({
        where: { userId, createdAt: { gte: findStartOfWeek() } },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to count number of submissions for this week',
          e instanceof Error ? e.stack : undefined,
          SubmissionsService.name,
        );
        throw e;
      });
  }
}
