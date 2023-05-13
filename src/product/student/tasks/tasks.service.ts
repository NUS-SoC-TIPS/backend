import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { transformRoomRecord } from '../../../utils';

import { TaskStatsEntity, TaskStatWindowStatus } from './entities';

@Injectable()
export class TasksService {
  constructor(private readonly prismaService: PrismaService) {}

  async findStats(userId: string, cohortId: number): Promise<TaskStatsEntity> {
    const cohortUser = await this.prismaService.cohortUser.findUniqueOrThrow({
      where: {
        userId_cohortId: {
          userId: userId,
          cohortId: cohortId,
        },
      },
      include: {
        cohortUserWindows: {
          include: {
            window: true,
            questionSubmissions: {
              include: {
                question: true,
              },
            },
            roomRecordUsers: {
              include: {
                roomRecord: {
                  include: {
                    roomRecordUsers: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const currentDate = new Date();
    return cohortUser.cohortUserWindows
      .sort((a, b) => a.window.startAt.getTime() - b.window.startAt.getTime())
      .map((cohortUserWindow) => {
        const {
          questionSubmissions: submissions,
          roomRecordUsers,
          window,
        } = cohortUserWindow;
        const records = roomRecordUsers.map((roomRecordUser) =>
          transformRoomRecord(roomRecordUser.roomRecord, userId),
        );
        const hasCompletedQuestions = submissions.length >= window.numQuestions;
        const hasCompletedInterview =
          !window.requireInterview || records.length > 0;
        const status =
          hasCompletedQuestions && hasCompletedInterview
            ? TaskStatWindowStatus.COMPLETED
            : window.endAt < currentDate
            ? TaskStatWindowStatus.FAILED
            : TaskStatWindowStatus.NONE;
        return {
          ...window,
          submissions,
          records,
          hasCompletedQuestions,
          hasCompletedInterview,
          status,
        };
      });
  }
}
