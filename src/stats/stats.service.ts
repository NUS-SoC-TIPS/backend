import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Question, QuestionSubmission, UserRole, Window } from '@prisma/client';

import { DataService } from '../data/data.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecordsService } from '../records/records.service';
import { SubmissionsService } from '../submissions/submissions.service';

import { AdminStats, AdminStatWindow } from './entities/admin-stats.entity';
import { TaskStats, TaskStatWindowStatus } from './entities/task-stats.entity';

@Injectable()
export class StatsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly submissionsService: SubmissionsService,
    private readonly recordsService: RecordsService,
    private readonly dataService: DataService,
  ) {}

  findLatestSubmission(
    userId: string,
  ): Promise<(QuestionSubmission & { question: Question }) | null> {
    return this.submissionsService.findLatest(userId);
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
    const currentDate = new Date();

    return await Promise.all(
      windows.map(async (window) => {
        const submissions = await this.submissionsService.findWithinWindow(
          userId,
          window,
        );
        const interviews = await this.recordsService.findValidWithinWindow(
          userId,
          window,
        );
        const hasCompletedSubmissions =
          submissions.length >= window.numQuestions;
        const hasCompletedInterview =
          !window.requireInterview || interviews.length > 0;
        const status =
          hasCompletedSubmissions && hasCompletedInterview
            ? TaskStatWindowStatus.COMPLETED
            : window.endAt < currentDate
            ? TaskStatWindowStatus.FAILED
            : TaskStatWindowStatus.NONE;

        return {
          ...window,
          submissions,
          hasCompletedSubmissions,
          interviews,
          hasCompletedInterview,
          status,
        };
      }),
    );
  }

  async findAdminStats(): Promise<AdminStats> {
    const currentDate = new Date();
    // We will only consider current or past windows of current iteration
    const windows = await this.prismaService.window.findMany({
      where: {
        iteration: Number(this.configService.get('CURRENT_ITERATION')),
        startAt: {
          lte: currentDate,
        },
      },
      orderBy: {
        startAt: 'desc',
      },
    });
    return Promise.all(
      windows.map((window) => this.computeAdminStatWindow(window)),
    );
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

  // TODO: Add redis caching for past windows
  private async computeAdminStatWindow(
    window: Window,
  ): Promise<AdminStatWindow> {
    const students = this.dataService.getStudentData().map((s) => ({
      ...s,
      githubUsernameLower: s.githubUsername.toLocaleLowerCase(),
    }));
    const githubUsernames = new Set(students.map((s) => s.githubUsernameLower));
    const studentMap = new Map(students.map((s) => [s.githubUsernameLower, s]));

    const usersInSystem = (
      await this.prismaService.user.findMany({
        where: {
          createdAt: {
            lte: window.endAt,
          },
          role: UserRole.NORMAL,
        },
        include: {
          questionSubmissions: {
            where: {
              createdAt: {
                gte: window.startAt,
                lte: window.endAt,
              },
            },
          },
          roomRecordUsers: {
            where: {
              isInterviewer: false,
              createdAt: {
                gte: window.startAt,
                lte: window.endAt,
              },
            },
            include: {
              roomRecord: {
                include: {
                  roomRecordUsers: true,
                },
              },
            },
          },
        },
      })
    ).map((s) => ({
      ...s,
      githubUsernameLower: s.githubUsername.toLocaleLowerCase(),
    }));

    const usersInSystemWithWindowData = usersInSystem.map((user) => {
      const { questionSubmissions, roomRecordUsers, ...userData } = user;
      const numQuestions = questionSubmissions.length;
      const hasCompletedSubmissions = numQuestions >= window.numQuestions;
      const validRecords = roomRecordUsers
        .map((u) => u.roomRecord)
        .filter((r) => r.duration >= 900000 && r.roomRecordUsers.length === 2);
      const numInterviews = validRecords.length;
      const hasCompletedInterview =
        !window.requireInterview || numInterviews >= 1;

      return {
        ...userData,
        numQuestions,
        numInterviews,
        hasCompletedSubmissions,
        hasCompletedInterview,
        email: studentMap.get(user.githubUsernameLower)?.email ?? '',
        coursemologyProfile:
          studentMap.get(user.githubUsernameLower)?.coursemologyProfile ?? '',
      };
    });

    const studentsInSystem = [];
    const nonStudentsInSystem = [];
    usersInSystemWithWindowData.forEach((user) => {
      if (githubUsernames.has(user.githubUsernameLower)) {
        studentsInSystem.push(user);
      } else {
        nonStudentsInSystem.push(user);
      }
    });

    const numStudents = studentsInSystem.length;
    const totalQuestions = studentsInSystem
      .map((s) => s.numQuestions)
      .reduce((acc, count) => acc + count, 0);
    const avgNumQuestions =
      numStudents === 0 ? 0 : totalQuestions / numStudents;
    const joinedStudentGithubUsernames = new Set(
      studentsInSystem.map((s) => s.githubUsernameLower),
    );
    const studentsYetToJoin = students.filter(
      (s) => !joinedStudentGithubUsernames.has(s.githubUsernameLower),
    );

    const studentsWithIncompleteWindow = studentsInSystem.filter(
      (s) => !s.hasCompletedSubmissions || !s.hasCompletedInterview,
    );
    const studentsWithCompletedWindow = studentsInSystem.filter(
      (s) => s.hasCompletedSubmissions && s.hasCompletedInterview,
    );

    return {
      ...window,
      numStudents,
      numStudentsCompleted: numStudents - studentsWithIncompleteWindow.length,
      avgNumQuestions,
      studentsYetToJoin,
      studentsWithIncompleteWindow,
      studentsWithCompletedWindow,
      nonStudents: nonStudentsInSystem,
    };
  }
}
