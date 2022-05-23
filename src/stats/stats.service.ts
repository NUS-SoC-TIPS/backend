import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Question, QuestionSubmission, Window } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { TaskStats } from './entities/task-stats.entity';

@Injectable()
export class StatsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findLatestSubmission(
    userId: string,
  ): Promise<{ submission: QuestionSubmission; question: Question } | null> {
    const latestSubmission =
      await this.prismaService.questionSubmission.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          question: true,
        },
      });
    if (!latestSubmission) {
      return null;
    }
    const { question, ...submission } = latestSubmission;
    return { submission, question };
  }

  findNumCompletedThisWindow(
    userId: string,
    closestWindow: Window,
  ): Promise<number> {
    const currentDate = new Date();
    if (
      closestWindow.startAt <= currentDate &&
      closestWindow.endAt >= currentDate
    ) {
      // We're in the middle of a window, so we count using the window
      return this.prismaService.questionSubmission.count({
        where: {
          userId,
          createdAt: {
            gte: closestWindow.startAt,
            lte: closestWindow.endAt,
          },
        },
      });
    }

    // Else we count the current week's submissions
    return this.prismaService.questionSubmission.count({
      where: {
        userId,
        createdAt: {
          gte: this.getMonday(),
        },
      },
    });
  }

  // Logic behind closest window:
  // - If currently in the middle of a window, that will be returned
  // - Else if there exists a window in the future, the upcoming window will be returned
  // - Else (all windows are over), the most recent window will be returned
  async findClosestWindow(): Promise<Window> {
    const currentDate = new Date();
    const ongoingWindow = await this.prismaService.window.findFirst({
      where: {
        startAt: {
          lte: currentDate,
        },
        endAt: {
          gte: currentDate,
        },
      },
    });
    if (ongoingWindow) {
      return ongoingWindow;
    }

    const upcomingWindow = await this.prismaService.window.findFirst({
      where: {
        startAt: {
          gte: currentDate,
        },
      },
      orderBy: {
        startAt: 'asc',
      },
      take: 1,
    });
    if (upcomingWindow) {
      return upcomingWindow;
    }

    return this.prismaService.window.findFirst({
      orderBy: {
        startAt: 'desc',
      },
      take: 1,
    });
  }

  async findTaskStats(userId: string): Promise<TaskStats> {
    const windows = await this.prismaService.window.findMany({
      where: {
        iteration: Number(this.configService.get('CURRENT_ITERATION')),
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return {
      windows: await Promise.all(
        windows.map(async (window) => {
          const submissions =
            await this.prismaService.questionSubmission.findMany({
              where: {
                userId,
                createdAt: {
                  gte: window.startAt,
                  lte: window.endAt,
                },
              },
              include: {
                question: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            });
          const interviews = await this.prismaService.roomRecord.findMany({
            where: {
              roomRecordUsers: {
                some: {
                  userId,
                  isInterviewer: false,
                },
              },
            },
            include: {
              roomRecordUsers: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          return {
            window,
            submissions: submissions.map((s) => {
              const { question, ...submission } = s;
              return { question, submission };
            }),
            interviews: interviews.map((i) => {
              const { roomRecordUsers, ...record } = i;
              return {
                record,
                partner: roomRecordUsers.filter((u) => u.user.id !== userId)[0]
                  .user,
              };
            }),
          };
        }),
      ),
    };
  }

  // We won't handle much of timezones here. If it's slightly off, so be it.
  private getMonday(): Date {
    const date = new Date();
    const day = date.getDay() || 7; // Get current day number, converting Sun. to 7
    if (day !== 1) {
      // Only manipulate the date if it isn't Mon.
      date.setHours(-24 * (day - 1));
    } // Set the hours to day number minus 1
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
