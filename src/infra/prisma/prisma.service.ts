import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { MINIMUM_VALID_INTERVIEW_DURATION } from '../../product/general/rooms/rooms.constants';
import { DataService } from '../data/data.service';

import { Prisma, PrismaClient, Question, UserRole } from './generated';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly dataService: DataService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.seedAdmins();
    await this.seedLeetCode();
    await this.seedKattis();
    await this.seedStudents();
    await this.seedStudentResults();
    await this.seedIsValidForRecords();
    await this.matchSubmissionsAndRecordsToStudentResults();
    this.logger.log('All data seeded', PrismaService.name);
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  // Sequencing matters here!
  cleanDb(): Promise<Prisma.BatchPayload[]> {
    const deleteExclusions = this.exclusion.deleteMany();
    const deleteStudentResults = this.studentResult.deleteMany();
    const deleteWindows = this.window.deleteMany();
    const deleteStudents = this.student.deleteMany();
    const deleteCohorts = this.cohort.deleteMany();
    const deleteQuestionSubmissions = this.questionSubmission.deleteMany();
    const deleteRoomRecordUsers = this.roomRecordUser.deleteMany();
    const deleteQuestions = this.question.deleteMany();
    const deleteRoomRecords = this.roomRecord.deleteMany();
    const deleteRoomUsers = this.roomUser.deleteMany();
    const deleteRooms = this.room.deleteMany();
    const deleteSettings = this.settings.deleteMany();
    const deleteUsers = this.user.deleteMany();
    return this.$transaction([
      deleteExclusions,
      deleteStudentResults,
      deleteWindows,
      deleteStudents,
      deleteCohorts,
      deleteQuestionSubmissions,
      deleteRoomRecordUsers,
      deleteQuestions,
      deleteRoomRecords,
      deleteRoomUsers,
      deleteRooms,
      deleteSettings,
      deleteUsers,
    ])
      .catch((e) => {
        this.logger.error(
          'Failed to clean DB',
          e instanceof Error ? e.stack : undefined,
          PrismaService.name,
        );
        throw e;
      })
      .then((result) => {
        this.logger.log('DB cleaned', PrismaService.name);
        return result;
      });
  }

  private async seedAdmins(): Promise<void> {
    await this.user
      .updateMany({
        data: {
          role: UserRole.NORMAL,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to update all users to NORMAL during admin seeding',
          e instanceof Error ? e.stack : undefined,
          PrismaService.name,
        );
        throw e;
      });
    await this.user
      .updateMany({
        where: {
          githubUsername: {
            in: this.dataService.getAdminData(),
            mode: 'insensitive',
          },
        },
        data: {
          role: UserRole.ADMIN,
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to update admin users to ADMIN during admin seeding',
          e instanceof Error ? e.stack : undefined,
          PrismaService.name,
        );
        throw e;
      });
    this.logger.log('Admins seeded', PrismaService.name);
  }

  private seedLeetCode(): Promise<Question[]> {
    return Promise.all(
      this.dataService.getLeetCodeData().map((question) => {
        const { slug, source, ...questionData } = question;
        return this.question
          .upsert({
            create: {
              ...question,
            },
            update: {
              ...questionData,
            },
            where: {
              slug_source: {
                slug,
                source,
              },
            },
          })
          .catch((e) => {
            this.logger.error(
              `Failed to upsert LeetCode question with slug: ${slug}`,
              e instanceof Error ? e.stack : undefined,
              PrismaService.name,
            );
            throw e;
          });
      }),
    ).then((result) => {
      this.logger.log('LeetCode questions seeded', PrismaService.name);
      return result;
    });
  }

  private seedKattis(): Promise<Question[]> {
    return Promise.all(
      this.dataService.getKattisData().map((question) => {
        const { slug, source, ...questionData } = question;
        return this.question
          .upsert({
            create: {
              ...question,
            },
            update: {
              ...questionData,
            },
            where: {
              slug_source: {
                slug,
                source,
              },
            },
          })
          .catch((e) => {
            this.logger.error(
              `Failed to upsert Kattis question with slug: ${slug}`,
              e instanceof Error ? e.stack : undefined,
              PrismaService.name,
            );
            throw e;
          });
      }),
    ).then((result) => {
      this.logger.log('Kattis questions seeded', PrismaService.name);
      return result;
    });
  }

  private async seedStudents(): Promise<void> {
    const numStudents = await this.student.count();
    if (numStudents > 0) {
      this.logger.log('Students have already been seeded', PrismaService.name);
      return;
    }
    // The following code seeds the students of the first cohort.
    const firstCohort = await this.cohort.findFirst();
    if (firstCohort == null) {
      this.logger.log(
        'There should be an existing cohort, something is wrong',
        PrismaService.name,
      );
      return;
    }
    return Promise.all(
      this.dataService.getStudentData().map(async (student) => {
        const user = await this.user.findFirst({
          where: {
            githubUsername: student.githubUsername,
          },
        });
        if (user == null) {
          return Promise.resolve(null);
        }
        return this.student.create({
          data: {
            userId: user.id,
            cohortId: firstCohort.id,
            coursemologyName: student.name,
            coursemologyProfileUrl: student.coursemologyProfile,
          },
        });
      }),
    ).then((result) => {
      const numSeeded = result.filter((student) => student != null).length;
      this.logger.log(`${numSeeded} students seeded`, PrismaService.name);
      const numNotSeeded = result.length - numSeeded;
      this.logger.log(
        `${numNotSeeded} students could not be found`,
        PrismaService.name,
      );
    });
  }

  private async seedStudentResults(): Promise<void> {
    const numStudentResults = await this.studentResult.count();
    if (numStudentResults > 0) {
      this.logger.log(
        'Student records have already been seeded',
        PrismaService.name,
      );
      return;
    }
    const students = await this.student.findMany();
    // We can assume all windows are for the first cohort, for now.
    const windows = await this.window.findMany();
    return Promise.all(
      students.map(async (student) => {
        const studentResults = await Promise.all(
          windows.map((window) =>
            this.studentResult.create({
              data: {
                windowId: window.id,
                studentId: student.id,
              },
            }),
          ),
        );
        return studentResults;
      }),
    ).then((result) => {
      const numStudentResultsSeeded = result.reduce((a, b) => a + b.length, 0);
      this.logger.log(
        `${numStudentResultsSeeded} student results seeded`,
        PrismaService.name,
      );
    });
  }

  private async seedIsValidForRecords(): Promise<void> {
    const numIsValid = await this.roomRecord.count({
      where: { isValid: true },
    });
    if (numIsValid > 0) {
      this.logger.log(
        'Valid records have already been marked!',
        PrismaService.name,
      );
      return;
    }

    const roomRecords = await this.roomRecord.findMany({
      where: {
        roomRecordUsers: {
          some: {
            isInterviewer: false,
          },
        },
        duration: {
          gte: MINIMUM_VALID_INTERVIEW_DURATION,
        },
      },
      include: { roomRecordUsers: true },
    });
    const validRoomRecords = roomRecords.filter(
      (roomRecord) => roomRecord.roomRecordUsers.length === 2,
    );
    return Promise.all(
      validRoomRecords.map((roomRecord) =>
        this.roomRecord.update({
          where: { id: roomRecord.id },
          data: { isValid: true },
        }),
      ),
    ).then((result) => {
      this.logger.log(
        `${result.length} valid records updated!`,
        PrismaService.name,
      );
    });
  }

  private async matchSubmissionsAndRecordsToStudentResults(): Promise<void> {
    const numMatchedSubmissions = await this.questionSubmission.count({
      where: {
        studentResultId: {
          not: null,
        },
      },
    });
    const numMatchedRecords = await this.roomRecordUser.count({
      where: {
        studentResultId: {
          not: null,
        },
      },
    });
    if (numMatchedSubmissions > 0 || numMatchedRecords > 0) {
      this.logger.log(
        'Submissions and records have already been matched!',
        PrismaService.name,
      );
      return;
    }
    const studentResults = await this.studentResult.findMany({
      include: {
        window: true,
        student: true,
      },
    });
    return Promise.all(
      studentResults.map(async (studentResult) => {
        return Promise.all([
          this.questionSubmission.updateMany({
            data: {
              studentResultId: studentResult.id,
            },
            where: {
              userId: studentResult.student.userId,
              createdAt: {
                gte: studentResult.window.startAt,
                lte: studentResult.window.endAt,
              },
            },
          }),
          this.roomRecordUser.updateMany({
            data: {
              studentResultId: studentResult.id,
            },
            where: {
              userId: studentResult.student.userId,
              isInterviewer: false,
              roomRecord: {
                createdAt: {
                  gte: studentResult.window.startAt,
                  lte: studentResult.window.endAt,
                },
                isValid: true,
              },
            },
          }),
        ]);
      }),
    ).then(() => {
      this.logger.log('Submissions and records matched!', PrismaService.name);
    });
  }
}
