import { Injectable, Logger } from '@nestjs/common';

import { DataService } from '../data/data.service';
import { StudentData } from '../data/entities';
import {
  RecordWithPartner,
  SubmissionWithQuestion,
} from '../interfaces/interface';
import {
  Exclusion,
  RoomRecord,
  RoomRecordUser,
  User,
  UserRole,
  Window,
} from '../prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { MINIMUM_INTERVIEW_DURATION } from '../records/records.constants';
import { UsersService } from '../users/users.service';
import { WindowsService } from '../windows/windows.service';

import { CreateExclusionDto } from './dtos';
import {
  AdminStatsEntity,
  ExcludedUserWithWindowData,
  UserWithWindowData,
} from './entities';

type StudentDataItem = StudentData[0];

interface CustomStudentDataItem extends StudentDataItem {
  githubUsernameLower: string;
}

type UserFromQuery = User & {
  githubUsernameLower: string;
  questionSubmissions: SubmissionWithQuestion[];
  roomRecordUsers: (RoomRecordUser & {
    roomRecord: RoomRecord & {
      roomRecordUsers: (RoomRecordUser & { user: User })[];
    };
  })[];
  exclusions: (Exclusion & { window: Window })[];
};

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
    private readonly logger: Logger,
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
    const window = await this.windowsService.findOrThrow(dto.windowId);
    const user = await this.usersService.findOrThrow(dto.userId);
    if (!this.githubUsernames.has(user.githubUsername.toLowerCase())) {
      this.logger.error(
        `Failed to find user within student list, ID: ${dto.userId}`,
        undefined,
        AdminService.name,
      );
      throw new Error('User is not a student');
    }

    const existingExclusion = await this.prismaService.exclusion
      .findFirst({
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
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find nullable existing exclusion',
          e instanceof Error ? e.stack : undefined,
          AdminService.name,
        );
        throw e;
      });
    if (
      existingExclusion &&
      existingExclusion.window.startAt <= window.startAt
    ) {
      return existingExclusion;
    }

    dto.reason = dto.reason.trim();

    if (existingExclusion) {
      // Update if we're going for an earlier exclusion than the existing one for
      // the same iteration.
      return this.prismaService.exclusion
        .update({
          data: {
            windowId: dto.windowId,
            reason: dto.reason,
          },
          where: {
            id: existingExclusion.id,
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to shift exclusion',
            e instanceof Error ? e.stack : undefined,
            AdminService.name,
          );
          throw e;
        });
    }
    return await this.prismaService.exclusion
      .create({
        data: {
          ...dto,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to create exclusion',
          e instanceof Error ? e.stack : undefined,
          AdminService.name,
        );
        throw e;
      });
  }

  async removeExclusion(exclusionId: number): Promise<void> {
    await this.prismaService.exclusion
      .delete({ where: { id: exclusionId } })
      .catch((e) => {
        this.logger.error(
          'Attempted to delete non-existing exclusion',
          e instanceof Error ? e.stack : undefined,
          AdminService.name,
        );
        throw e;
      });
  }

  async findWindows(): Promise<Window[]> {
    const currentDate = new Date();
    const windows = await this.windowsService.findCurrentIterationWindows();
    return windows.filter((window) => window.startAt <= currentDate);
  }

  async findStats(windowId: number): Promise<AdminStatsEntity> {
    const window = await this.windowsService.findOrThrow(windowId);
    const users = await this.findUsersWithWindowDataWithinWindow(window);
    const usersWithWindowData: (UserWithWindowData & {
      githubUsernameLower: string;
      exclusion?: Exclusion;
    })[] = users.map((user) => this.transformUserData(user, window));

    const students: UserWithWindowData[] = [];
    const nonStudents: UserWithWindowData[] = [];
    const excludedStudents: ExcludedUserWithWindowData[] = [];
    usersWithWindowData.forEach((user) => {
      if (this.githubUsernames.has(user.githubUsernameLower)) {
        if (user.exclusion) {
          excludedStudents.push(user as ExcludedUserWithWindowData);
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
      .map((student) => student.submissions.length)
      .reduce((acc, count) => acc + count, 0);
    const averageNumberOfQuestions =
      numberOfStudents === 0 ? 0 : totalNumberOfQuestions / numberOfStudents;

    return {
      ...window,
      numberOfStudents,
      numberOfCompletedStudents: allStudents.filter((s) => s.hasCompletedWindow)
        .length,
      averageNumberOfQuestions,
      students,
      nonStudents,
      excludedStudents,
    };
  }

  private async findUsersWithWindowDataWithinWindow(
    window: Window,
  ): Promise<UserFromQuery[]> {
    const users = await this.prismaService.user
      .findMany({
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
            include: {
              question: true,
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
                  roomRecordUsers: {
                    include: {
                      user: true,
                    },
                  },
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
        orderBy: {
          name: 'asc',
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find users with window data',
          e instanceof Error ? e.stack : undefined,
          AdminService.name,
        );
        throw e;
      });

    return users
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
    user: UserFromQuery,
    window: Window,
  ): UserWithWindowData & {
    githubUsernameLower: string;
    exclusion?: Exclusion;
  } {
    const { questionSubmissions, roomRecordUsers, ...userData } = user;
    const hasCompletedQuestions =
      questionSubmissions.length >= window.numQuestions;
    const validRecords: RecordWithPartner[] = roomRecordUsers
      .map((u) => u.roomRecord)
      .filter(
        (r) =>
          r.duration >= MINIMUM_INTERVIEW_DURATION &&
          r.roomRecordUsers.length === 2,
      )
      .map((r) => {
        const partnerRoomUser = r.roomRecordUsers.filter(
          (u) => u.userId !== user.id,
        )[0];
        return {
          ...r,
          notes: partnerRoomUser.notes,
          partner: partnerRoomUser.user,
        };
      });
    const hasCompletedInterview =
      !window.requireInterview || validRecords.length >= 1;
    const hasCompletedWindow = hasCompletedQuestions && hasCompletedInterview;
    const exclusion = user.exclusions.find((e) => e.windowId === window.id);

    return {
      ...userData,
      submissions: questionSubmissions,
      records: validRecords,
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
