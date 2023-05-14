import { Injectable, Logger } from '@nestjs/common';

import { QuestionSubmission } from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WindowsService } from '../windows/windows.service';

@Injectable()
export class ResultsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly windowsService: WindowsService,
  ) {}

  async maybeMatchQuestionSubmission(
    submission: QuestionSubmission,
    userId: string,
  ): Promise<QuestionSubmission> {
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    if (ongoingWindow == null) {
      this.logger.log('No ongoing window for matching', ResultsService.name);
      return submission;
    }
    const student = await this.prismaService.student
      .findUnique({
        where: {
          userId_cohortId: {
            userId,
            cohortId: ongoingWindow.cohortId,
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find nullable student',
          e instanceof Error ? e.stack : undefined,
          ResultsService.name,
        );
        throw e;
      });
    if (student == null) {
      this.logger.log(
        'User is not a student of ongoing cohort',
        ResultsService.name,
      );
      return submission;
    }

    const studentResult = await this.prismaService.studentResult
      .findUniqueOrThrow({
        where: {
          studentId_windowId: {
            studentId: student.id,
            windowId: ongoingWindow.id,
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find student result',
          e instanceof Error ? e.stack : undefined,
          ResultsService.name,
        );
        throw e;
      });

    return this.prismaService.questionSubmission
      .update({
        where: {
          id: submission.id,
        },
        data: {
          studentResultId: studentResult.id,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to update question submission',
          e instanceof Error ? e.stack : undefined,
          ResultsService.name,
        );
        throw e;
      });
  }
}
