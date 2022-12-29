import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  Question,
  UserRole,
  Window,
} from '@prisma/client';

import { DataService } from '../data/data.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    private readonly dataService: DataService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.seedAdmins();
    await this.seedWindows();
    await this.seedLeetCode();
    await this.seedKattis();
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
    const deleteWindows = this.window.deleteMany();
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
      deleteWindows,
      deleteQuestionSubmissions,
      deleteRoomRecordUsers,
      deleteQuestions,
      deleteRoomRecords,
      deleteRoomUsers,
      deleteRooms,
      deleteSettings,
      deleteUsers,
    ])
      .catch((e: Error) => {
        this.logger.error('Failed to clean DB', e.stack, PrismaService.name);
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
      .catch((e: Error) => {
        this.logger.error(
          'Failed to update all users to NORMAL during admin seeding',
          e.stack,
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
      .catch((e: Error) => {
        this.logger.error(
          'Failed to update admin users to ADMIN during admin seeding',
          e.stack,
          PrismaService.name,
        );
        throw e;
      });
    this.logger.log('Admins seeded', PrismaService.name);
  }

  private async seedWindows(): Promise<Window[]> {
    return Promise.all(
      this.dataService.getWindowData().map((window) => {
        const { id, ...windowData } = window;
        return this.window
          .upsert({
            create: {
              ...window,
            },
            update: {
              ...windowData,
            },
            where: {
              id,
            },
          })
          .catch((e: Error) => {
            this.logger.error(
              `Failed to seed window with ID: ${window.id}`,
              e.stack,
              PrismaService.name,
            );
            throw e;
          });
      }),
    ).then((result) => {
      this.logger.log('Windows seeded', PrismaService.name);
      return result;
    });
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
          .catch((e: Error) => {
            this.logger.error(
              `Failed to upsert LeetCode question with slug: ${slug}`,
              e.stack,
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
          .catch((e: Error) => {
            this.logger.error(
              `Failed to upsert Kattis question with slug: ${slug}`,
              e.stack,
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
}
