import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Exclusion,
  QuestionSubmission,
  RoomRecord,
  RoomRecordUser,
  User,
  UserRole,
  Window,
} from '@prisma/client';

import { DataService } from '../data/data.service';
import { StudentData } from '../data/entities';
import { PrismaService } from '../prisma/prisma.service';
import { MINIMUM_INTERVIEW_DURATION } from '../records/records.constants';
import { UsersService } from '../users/users.service';
import { WindowsService } from '../windows/windows.service';

import { CreateExclusionDto } from './dtos';
import {
  AdminStatsEntity,
  UserThatHasYetToJoin,
  UserWithWindowData,
} from './entities';

type StudentDataItem = StudentData[0];

interface CustomStudentDataItem extends StudentDataItem {
  githubUsernameLower: string;
}

@Injectable()
export class AdminService {
  private studentData: CustomStudentDataItem[];
  private githubUsernames: Set<string>;
  private studentMap: Map<string, CustomStudentDataItem>;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly windowsService: WindowsService,
    private readonly dataService: DataService,
    private readonly usersService: UsersService,
  ) {
    this.studentData = this.dataService.getStudentData().map((s) => ({
      ...s,
      githubUsernameLower: s.githubUsername.toLocaleLowerCase(),
    }));
    this.githubUsernames = new Set(
      this.studentData.map((s) => s.githubUsernameLower),
    );
    this.studentMap = new Map(
      this.studentData.map((s) => [s.githubUsernameLower, s]),
    );
  }

  async createExclusion(dto: CreateExclusionDto): Promise<Exclusion> {
    const window = await this.windowsService.find(dto.windowId);
    if (!window) {
      throw new BadRequestException();
    }
    const user = await this.usersService.find(dto.userId);
    if (!user || !this.githubUsernames.has(user.githubUsername.toLowerCase())) {
      throw new BadRequestException();
    }

    const existingExclusion = await this.prismaService.exclusion.findFirst({
      where: {
        userId: dto.userId,
        window: {
          iteration: {
            equals: window.iteration,
          },
        },
      },
      include: {
        window: true,
      },
    });
    if (
      existingExclusion &&
      existingExclusion.window.startAt <= window.startAt
    ) {
      return existingExclusion;
    }
    if (existingExclusion) {
      // Update if we're going for an earlier exclusion than the existing one for
      // the same iteration.
      return this.prismaService.exclusion.update({
        data: {
          windowId: dto.windowId,
        },
        where: {
          id: existingExclusion.id,
        },
      });
    }
    return await this.prismaService.exclusion.create({
      data: {
        ...dto,
      },
    });
  }

  async removeExclusion(exclusionId: number): Promise<void> {
    await this.prismaService.exclusion.delete({ where: { id: exclusionId } });
  }

  async findWindows(): Promise<Window[]> {
    const currentDate = new Date();
    const windows = await this.windowsService.findCurrentIterationWindows();
    return windows.filter((window) => window.startAt <= currentDate);
  }

  async findStats(windowId: number): Promise<AdminStatsEntity> {
    const window = await this.windowsService.find(windowId);
    const users = await this.findUsersWithWindowDataWithinWindow(window);
    const usersWithWindowData: (UserWithWindowData & {
      githubUsernameLower: string;
      exclusion?: Exclusion;
    })[] = users.map((user) => this.transformUserData(user, window));

    const students = [];
    const nonStudents = [];
    const excludedStudents = [];
    usersWithWindowData.forEach((user) => {
      if (this.githubUsernames.has(user.githubUsernameLower)) {
        if (user.exclusion) {
          excludedStudents.push(user);
        } else {
          students.push(user);
        }
      } else {
        nonStudents.push(user);
      }
    });

    const allStudents = [...students, ...excludedStudents];
    const numberOfStudents = allStudents.length;
    const totalNumberOfQuestions = allStudents
      .map((student) => student.numberOfQuestions)
      .reduce((acc, count) => acc + count, 0);
    const averageNumberOfQuestions =
      numberOfStudents === 0 ? 0 : totalNumberOfQuestions / numberOfStudents;
    const joinedStudentGithubUsernames = new Set(
      allStudents.map((student) => student.githubUsernameLower),
    );
    const studentsYetToJoin: UserThatHasYetToJoin[] = this.studentData
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

    return {
      ...window,
      numberOfStudents,
      numberOfCompletedStudents: allStudents.filter((s) => s.hasCompletedWindow)
        .length,
      averageNumberOfQuestions,
      studentsYetToJoin,
      students,
      nonStudents,
      excludedStudents,
    };
  }

  private async findUsersWithWindowDataWithinWindow(window: Window): Promise<
    (User & {
      githubUsernameLower: string;
      questionSubmissions: QuestionSubmission[];
      roomRecordUsers: (RoomRecordUser & {
        roomRecord: RoomRecord & { roomRecordUsers: RoomRecordUser[] };
      })[];
      exclusions: (Exclusion & { window: Window })[];
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
          exclusions: {
            include: {
              window: true,
            },
          },
        },
      })
    )
      .filter((user) =>
        user.exclusions.every(
          (e) =>
            e.window.iteration !== window.iteration ||
            e.window.startAt >= window.startAt,
        ),
      )
      .map((user) => ({
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
      exclusions: (Exclusion & { window: Window })[];
    },
    window: Window,
  ): UserWithWindowData & {
    githubUsernameLower: string;
    exclusion?: Exclusion;
  } {
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
    const hasCompletedWindow = hasCompletedQuestions && hasCompletedInterview;
    const exclusion = user.exclusions.find((e) => e.windowId === window.id);

    return {
      ...userData,
      numberOfQuestions,
      numberOfInterviews,
      hasCompletedWindow,
      coursemologyName:
        this.studentMap.get(user.githubUsernameLower)?.name ?? '',
      coursemologyEmail:
        this.studentMap.get(user.githubUsernameLower)?.email ?? '',
      coursemologyProfileLink:
        this.studentMap.get(user.githubUsernameLower)?.coursemologyProfile ??
        '',
      exclusion,
    };
  }
}