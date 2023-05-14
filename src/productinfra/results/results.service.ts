import { Injectable, Logger } from '@nestjs/common';

import {
  QuestionSubmission,
  StudentResult,
} from '../../infra/prisma/generated';
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
    const studentResult = await this.findStudentResultForOngoingWindow(userId);
    if (studentResult == null) {
      return submission;
    }
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

  private async findStudentResultForOngoingWindow(
    userId: string,
  ): Promise<StudentResult | null> {
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    if (ongoingWindow == null) {
      this.logger.log('No ongoing window', ResultsService.name);
      return null;
    }

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
          ResultsService.name,
        );
        throw e;
      });
    if (student == null) {
      this.logger.log(
        'User is not a student of ongoing cohort',
        ResultsService.name,
      );
      return null;
    }

    return this.prismaService.studentResult
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
  }
}
