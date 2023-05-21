import { Injectable, Logger } from '@nestjs/common';

import {
  Cohort,
  QuestionSubmission,
  RoomRecordUser,
  StudentResult,
  Window,
} from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class CurrentService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  async maybeAddQuestionSubmissionToResult(
    submission: QuestionSubmission,
  ): Promise<QuestionSubmission> {
    const studentResult = await this.findStudentResultForOngoingWindow(
      submission.userId,
    );
    if (studentResult == null) {
      return submission;
    }
    return this.prismaService.questionSubmission.update({
      where: { id: submission.id },
      data: { studentResultId: studentResult.id },
    });
  }

  async maybeAddRoomRecordUserToResult(
    recordUser: RoomRecordUser,
  ): Promise<RoomRecordUser> {
    const studentResult = await this.findStudentResultForOngoingWindow(
      recordUser.userId,
    );
    if (studentResult == null) {
      return recordUser;
    }
    return this.prismaService.roomRecordUser.update({
      where: { id: recordUser.id },
      data: { studentResultId: studentResult.id },
    });
  }

  findOngoingWindow(): Promise<Window | null> {
    const currentDate = new Date();
    return this.prismaService.window.findFirst({
      where: { startAt: { lte: currentDate }, endAt: { gte: currentDate } },
    });
  }

  async findOngoingCohort(): Promise<Cohort | null> {
    const ongoingWindow = await this.findOngoingWindow();
    if (ongoingWindow == null) {
      return null;
    }
    return this.prismaService.cohort.findUnique({
      where: { id: ongoingWindow.cohortId },
    });
  }

  private async findStudentResultForOngoingWindow(
    userId: string,
  ): Promise<StudentResult | null> {
    const ongoingWindow = await this.findOngoingWindow();
    if (ongoingWindow == null) {
      this.logger.log('No ongoing window', CurrentService.name);
      return null;
    }
    return this.prismaService.studentResult
      .findFirst({
        where: {
          student: { userId, cohortId: ongoingWindow.cohortId },
          windowId: ongoingWindow.id,
        },
      })
      .then((studentResult) => {
        if (studentResult == null) {
          this.logger.log('User is not a student', CurrentService.name);
        }
        return studentResult;
      });
  }
}
