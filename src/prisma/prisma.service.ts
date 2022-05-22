import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  Question,
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
  Window,
} from '@prisma/client';

import leetCodeQuestions from '../data/leetcode.json';
import windows from '../data/windows.json';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.seedWindows();
    await this.seedLeetCodeQuestions();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  // Sequencing matters here!
  cleanDb(): Promise<Prisma.BatchPayload[]> {
    const deleteRoomRecordUsers = this.roomRecordUser.deleteMany();
    const deleteQuestions = this.question.deleteMany();
    const deleteRoomRecords = this.roomRecord.deleteMany();
    const deleteRoomUsers = this.roomUser.deleteMany();
    const deleteRooms = this.room.deleteMany();
    const deleteUsers = this.user.deleteMany();
    return this.$transaction([
      deleteRoomRecordUsers,
      deleteQuestions,
      deleteRoomRecords,
      deleteRoomUsers,
      deleteRooms,
      deleteUsers,
    ]);
  }

  private seedWindows(): Promise<Window[]> {
    return Promise.all(
      windows.map((window) => {
        const {
          id,
          startAt,
          endAt,
          iteration,
          requireInterview,
          numQuestions,
        } = window;
        const startAtDate = new Date(startAt);
        const endAtDate = new Date(endAt);
        return this.window.upsert({
          create: {
            id,
            startAt: startAtDate,
            endAt: endAtDate,
            iteration,
            requireInterview,
            numQuestions,
          },
          update: {
            startAt: startAtDate,
            endAt: endAtDate,
            iteration,
            requireInterview,
            numQuestions,
          },
          where: {
            id,
          },
        });
      }),
    );
  }

  private seedLeetCodeQuestions(): Promise<Question[]> {
    return Promise.all(
      leetCodeQuestions.map((question) => {
        const { id, name, slug, isPremium, difficulty, type, source } =
          question;
        return this.question.upsert({
          create: {
            slug,
            id,
            name,
            difficulty: QuestionDifficulty[difficulty],
            type: QuestionType[type],
            source: QuestionSource[source],
            isPremium,
          },
          update: {
            name,
            id,
            difficulty: QuestionDifficulty[difficulty],
            type: QuestionType[type],
            isPremium,
          },
          where: {
            slug_source: {
              slug,
              source: QuestionSource[source],
            },
          },
        });
      }),
    );
  }
}
