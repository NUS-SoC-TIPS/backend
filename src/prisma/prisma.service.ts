import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  Question,
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '@prisma/client';

import leetCodeQuestions from '../data/leetcode.json';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
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
            source: QuestionSource[source],
            isPremium,
          },
          where: {
            slug,
          },
        });
      }),
    );
  }
}
