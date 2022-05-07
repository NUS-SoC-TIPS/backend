import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
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
}
