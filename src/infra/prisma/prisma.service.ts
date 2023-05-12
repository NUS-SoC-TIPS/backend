import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

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
    await this.seedCohortUsers();
    await this.seedCohortUserWindows();
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
    const deleteCohortUserWindows = this.cohortUserWindow.deleteMany();
    const deleteWindows = this.window.deleteMany();
    const deleteCohortUsers = this.cohortUser.deleteMany();
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
      deleteCohortUserWindows,
      deleteWindows,
      deleteCohortUsers,
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

  private async seedCohortUsers(): Promise<void> {
    const numCohortUsers = await this.cohortUser.count();
    if (numCohortUsers > 0) {
      this.logger.log(
        'Cohort users have already been seeded',
        PrismaService.name,
      );
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
        return this.cohortUser.create({
          data: {
            userId: user.id,
            cohortId: firstCohort.id,
            coursemologyName: student.name,
            coursemologyProfileUrl: student.coursemologyProfile,
          },
        });
      }),
    ).then((result) => {
      const numSeeded = result.filter(
        (cohortUser) => cohortUser != null,
      ).length;
      this.logger.log(`${numSeeded} cohort users seeded`, PrismaService.name);
      const numNotSeeded = result.length - numSeeded;
      this.logger.log(
        `${numNotSeeded} students could not be found`,
        PrismaService.name,
      );
    });
  }

  private async seedCohortUserWindows(): Promise<void> {
    const numCohortUserWindows = await this.cohortUserWindow.count();
    if (numCohortUserWindows > 0) {
      this.logger.log(
        'Cohort user windows have already been seeded',
        PrismaService.name,
      );
      return;
    }
    const cohortUsers = await this.cohortUser.findMany();
    // We can assume all windows are for the first cohort, for now.
    const windows = await this.window.findMany();
    return Promise.all(
      cohortUsers.map(async (cohortUser) => {
        const cohortUserWindows = await Promise.all(
          windows.map((window) =>
            this.cohortUserWindow.create({
              data: {
                windowId: window.id,
                cohortUserId: cohortUser.id,
              },
            }),
          ),
        );
        return cohortUserWindows;
      }),
    ).then((result) => {
      const numCohortUserWindowsSeeded = result.reduce(
        (a, b) => a + b.length,
        0,
      );
      this.logger.log(
        `${numCohortUserWindowsSeeded} cohort user windows seeded`,
        PrismaService.name,
      );
    });
  }
}
