import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
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
  constructor(private readonly dataService: DataService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.seedAdmins();
    await this.seedWindows();
    await this.seedLeetCode();
    await this.seedKattis();
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
    ]);
  }

  private async seedAdmins(): Promise<void> {
    await this.user.updateMany({
      data: {
        role: UserRole.NORMAL,
      },
    });
    await this.user.updateMany({
      where: {
        githubUsername: {
          in: this.dataService.getAdminData(),
          mode: 'insensitive',
        },
      },
      data: {
        role: UserRole.ADMIN,
      },
    });
  }

  private async seedWindows(): Promise<Window[]> {
    return Promise.all(
      this.dataService.getWindowData().map((window) => {
        const { id, ...windowData } = window;
        return this.window.upsert({
          create: {
            ...window,
          },
          update: {
            ...windowData,
          },
          where: {
            id,
          },
        });
      }),
    );
  }

  private seedLeetCode(): Promise<Question[]> {
    return Promise.all(
      this.dataService.getLeetCodeData().map((question) => {
        const { slug, source, ...questionData } = question;
        return this.question.upsert({
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
        });
      }),
    );
  }

  private seedKattis(): Promise<Question[]> {
    return Promise.all(
      this.dataService.getKattisData().map((question) => {
        const { slug, source, ...questionData } = question;
        return this.question.upsert({
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
        });
      }),
    );
  }
}
