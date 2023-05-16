import { Injectable, Logger } from '@nestjs/common';

import {
  QuestionDifficulty,
  QuestionSubmission,
} from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ResultsService } from '../../../productinfra/results/results.service';
import { findStartOfWeek } from '../../../utils';

import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import { SubmissionStatsEntity } from './entities';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly resultsService: ResultsService,
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
    return this.resultsService.maybeMatchQuestionSubmission(submission);
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
    const [numberOfSubmissionsForThisWindowOrWeek, numQuestions] =
      await this.countSubmissionsForThisWindowOrWeek(userId);
    // TODO: Rewrite this to be paginated, perhaps as part of a separate endpoint
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
    // TODO: When allSubmissions is paginated, rewrite this into a single query
    const latestSubmission =
      allSubmissions.length > 0 ? allSubmissions[0] : null;
    // TODO: When allSubmissions is paginated, rewrite this into a count query
    const stats = allSubmissions.reduce(
      (acc, curr) => {
        switch (curr.question.difficulty) {
          case QuestionDifficulty.EASY:
            acc.numEasyCompleted += 1;
            break;
          case QuestionDifficulty.MEDIUM:
            acc.numMediumCompleted += 1;
            break;
          case QuestionDifficulty.HARD:
            acc.numHardCompleted += 1;
        }
        return acc;
      },
      { numEasyCompleted: 0, numMediumCompleted: 0, numHardCompleted: 0 },
    );
    return {
      numberOfSubmissionsForThisWindowOrWeek,
      numQuestions,
      stats,
      latestSubmission,
      allSubmissions,
    };
  }

  /**
   * Returns the number of submissions for this window (if any) or week (if no window), along with
   * the number of questions this window requires. If no window is ongoing, then the second value
   * would be null.
   */
  private async countSubmissionsForThisWindowOrWeek(
    userId: string,
  ): Promise<[number, number | null]> {
    const [studentResult, ongoingWindow] =
      await this.resultsService.findStudentResultForOngoingWindow(userId);
    if (studentResult != null) {
      return [
        studentResult._count.questionSubmissions,
        ongoingWindow?.numQuestions ?? null,
      ];
    }
    return [
      await this.prismaService.questionSubmission
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
        }),
      null,
    ];
  }
}
