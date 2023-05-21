import { Injectable, Logger } from '@nestjs/common';

import {
  QuestionSubmission,
  RoomRecordUser,
  StudentResult,
  Window,
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
  ): Promise<QuestionSubmission> {
    const [studentResult, _] = await this.findStudentResultForOngoingWindow(
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

  async maybeMatchRoomRecordUser(
    recordUser: RoomRecordUser,
  ): Promise<RoomRecordUser> {
    const [studentResult, _] = await this.findStudentResultForOngoingWindow(
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

  /**
   * Returns the student result for the given userId (if any) and the ongoing cohort window (if any).
   */
  async findStudentResultForOngoingWindow(userId: string): Promise<
    [
      (
        | (StudentResult & {
            _count: {
              questionSubmissions: number;
              roomRecordUsers: number;
            };
          })
        | null
      ),
      Window | null,
    ]
  > {
    // Finding window may throw. We will not catch here and instead let the
    // controller handle it.
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    if (ongoingWindow == null) {
      this.logger.log('No ongoing window', ResultsService.name);
      return [null, null];
    }

    const student = await this.prismaService.student.findUnique({
      where: { userId_cohortId: { userId, cohortId: ongoingWindow.cohortId } },
    });

    if (student == null) {
      this.logger.log(
        'User is not a student of ongoing cohort',
        ResultsService.name,
      );
      return [null, ongoingWindow];
    }

    return [
      await this.prismaService.studentResult.findUniqueOrThrow({
        where: {
          studentId_windowId: {
            studentId: student.id,
            windowId: ongoingWindow.id,
          },
        },
        include: {
          _count: {
            select: { questionSubmissions: true, roomRecordUsers: true },
          },
        },
      }),
      ongoingWindow,
    ];
  }
}
