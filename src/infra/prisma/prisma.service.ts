import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { DataService } from '../data/data.service';

import { Prisma, PrismaClient, Question, UserRole } from './generated';

@Injectable()
export class PrismaService
  extends PrismaClient<
    Prisma.PrismaClientOptions,
    'query' | 'info' | 'warn' | 'error'
  >
  implements OnModuleInit
{
  constructor(
    private readonly logger: Logger,
    private readonly dataService: DataService,
  ) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
    // this.$on('query', (e) => this.logger.debug(e, PrismaService.name));
    this.$on('info', (e) => {
      this.logger.log(e, PrismaService.name);
    });
    this.$on('warn', (e) => {
      this.logger.warn(e, PrismaService.name);
    });
    this.$on('error', (e) => {
      this.logger.error(e, undefined, PrismaService.name);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.seedAdmins();
    await this.seedLeetCode();
    await this.seedKattis();
    this.logger.log('All data seeded', PrismaService.name);
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
    ]).then((result) => {
      this.logger.log('DB cleaned', PrismaService.name);
      return result;
    });
  }

  private async seedAdmins(): Promise<void> {
    await this.user.updateMany({ data: { role: UserRole.NORMAL } });
    await this.user.updateMany({
      where: {
        githubUsername: {
          in: this.dataService.getAdminData(),
          mode: 'insensitive',
        },
      },
      data: { role: UserRole.ADMIN },
    });
    this.logger.log('Admins seeded', PrismaService.name);
  }

  /**
   * It turns out that LeetCode often updates the names and slugs of their questions.
   * As such, we will check if an ID-based update is needed first.
   */
  private seedLeetCode(): Promise<Question[]> {
    const leetCodeData = this.dataService.getLeetCodeData();
    return Promise.all(
      leetCodeData.map(async (question) => {
        const { id, source, slug, ...questionData } = question;
        const existingQuestion = await this.question.findUnique({
          where: { id_source: { id, source } },
        });
        if (!existingQuestion || existingQuestion.slug === slug) {
          return this.question.upsert({
            create: { ...question },
            update: { ...questionData, id },
            where: { slug_source: { slug, source } },
          });
        }
        return this.question.update({
          where: { id_source: { id, source } },
          data: { ...questionData, slug },
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
        return this.question.upsert({
          create: { ...question },
          update: { ...questionData },
          where: { slug_source: { slug, source } },
        });
      }),
    ).then((result) => {
      this.logger.log('Kattis questions seeded', PrismaService.name);
      return result;
    });
  }
}
