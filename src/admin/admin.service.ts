import { Injectable } from '@nestjs/common';
import {
  QuestionSubmission,
  RoomRecord,
  RoomRecordUser,
  User,
  UserRole,
  Window,
} from '@prisma/client';

import { DataService } from '../data/data.service';
import { PrismaService } from '../prisma/prisma.service';
import { MINIMUM_INTERVIEW_DURATION } from '../records/records.constants';
import { RecordsService } from '../records/records.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { WindowsService } from '../windows/windows.service';

import {
  AdminStatsEntity,
  UserThatHasYetToJoin,
  UserWithWindowData,
} from './entities';

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly windowsService: WindowsService,
    private readonly submissionsService: SubmissionsService,
    private readonly recordsService: RecordsService,
    private readonly dataService: DataService,
  ) {}

  async findStats(): Promise<AdminStatsEntity> {
    const windows = await this.windowsService.findCurrentIterationWindows();
    const studentData = this.dataService.getStudentData().map((s) => ({
      ...s,
      githubUsernameLower: s.githubUsername.toLocaleLowerCase(),
    }));
    const githubUsernames = new Set(
      studentData.map((s) => s.githubUsernameLower),
    );
    const studentMap = new Map(
      studentData.map((s) => [s.githubUsernameLower, s]),
    );
    return await Promise.all(
      windows.map(async (window) => {
        const users = await this.findUsersWithWindowDataWithinWindow(window);
        const usersWithWindowData: (UserWithWindowData & {
          githubUsernameLower: string;
        })[] = users.map((user) =>
          this.transformUserData(user, studentMap, window),
        );

        const students = [];
        const nonStudents = [];
        usersWithWindowData.forEach((user) => {
          if (githubUsernames.has(user.githubUsernameLower)) {
            students.push(user);
          } else {
            nonStudents.push(user);
          }
        });

        const numberOfStudents = students.length;
        const totalNumberOfQuestions = students
          .map((student) => student.numberOfQuestions)
          .reduce((acc, count) => acc + count, 0);
        const averageNumberOfQuestions =
          numberOfStudents === 0
            ? 0
            : totalNumberOfQuestions / numberOfStudents;
        const joinedStudentGithubUsernames = new Set(
          students.map((student) => student.githubUsernameLower),
        );
        const studentsYetToJoin: UserThatHasYetToJoin[] = studentData
          .filter(
            (student) =>
              !joinedStudentGithubUsernames.has(student.githubUsernameLower),
          )
          .map((student) => ({
            coursemologyName: student.name,
            coursemologyEmail: student.email,
            coursemologyProfileLink: student.coursemologyProfile,
            githubUsername: student.githubUsername,
          }));

        const studentsWithIncompleteWindow = students.filter(
          (student) =>
            !student.hasCompletedQuestions || !student.hasCompletedInterview,
        );
        const studentsWithCompletedWindow = students.filter(
          (student) =>
            student.hasCompletedQuestions && student.hasCompletedInterview,
        );

        return {
          ...window,
          numberOfStudents,
          numberOfCompletedStudents:
            numberOfStudents - studentsWithIncompleteWindow.length,
          averageNumberOfQuestions,
          studentsYetToJoin,
          studentsWithIncompleteWindow,
          studentsWithCompletedWindow,
          nonStudents,
        };
      }),
    );
  }

  private async findUsersWithWindowDataWithinWindow(window: Window): Promise<
    (User & {
      githubUsernameLower: string;
      questionSubmissions: QuestionSubmission[];
      roomRecordUsers: (RoomRecordUser & {
        roomRecord: RoomRecord & { roomRecordUsers: RoomRecordUser[] };
      })[];
    })[]
  > {
    return (
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
    ).map((user) => ({
      ...user,
      githubUsernameLower: user.githubUsername.toLocaleLowerCase(),
    }));
  }

  private transformUserData(
    user: User & {
      githubUsernameLower: string;
      questionSubmissions: QuestionSubmission[];
      roomRecordUsers: (RoomRecordUser & {
        roomRecord: RoomRecord & { roomRecordUsers: RoomRecordUser[] };
      })[];
    },
    studentMap: Map<
      string,
      {
        githubUsernameLower: string;
        name: string;
        githubUsername: string;
        email: string;
        coursemologyProfile: string;
      }
    >,
    window: Window,
  ): UserWithWindowData & { githubUsernameLower: string } {
    const { questionSubmissions, roomRecordUsers, ...userData } = user;
    const numberOfQuestions = questionSubmissions.length;
    const hasCompletedQuestions = numberOfQuestions >= window.numQuestions;
    const validRecords = roomRecordUsers
      .map((u) => u.roomRecord)
      .filter(
        (r) =>
          r.duration >= MINIMUM_INTERVIEW_DURATION &&
          r.roomRecordUsers.length === 2,
      );
    const numberOfInterviews = validRecords.length;
    const hasCompletedInterview =
      !window.requireInterview || numberOfInterviews >= 1;

    return {
      ...userData,
      numberOfQuestions,
      numberOfInterviews,
      hasCompletedQuestions,
      hasCompletedInterview,
      coursemologyName: studentMap.get(user.githubUsernameLower)?.name ?? '',
      coursemologyEmail: studentMap.get(user.githubUsernameLower)?.email ?? '',
      coursemologyProfileLink:
        studentMap.get(user.githubUsernameLower)?.coursemologyProfile ?? '',
    };
  }
}
