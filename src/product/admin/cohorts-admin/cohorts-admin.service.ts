import { Injectable, Logger } from '@nestjs/common';

import { DateService } from '../../../infra/date/date.service';
import {
  Student,
  StudentResult,
  Window,
} from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  makeStudentBase,
  makeStudentBaseWithId,
  makeWindowBase,
  WindowBase,
} from '../../../product/interfaces';

import {
  CohortAdminItem,
  CohortAdminUpdateResult,
  CohortStudentValidationResult,
} from './cohorts-admin.interfaces';
import {
  CreateCohortDto,
  CreateStudentDto,
  CreateWindowDto,
  UpdateCohortDto,
  UpdateWindowDto,
} from './dtos';

type Transaction = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;

@Injectable()
export class CohortsAdminService {
  constructor(
    private readonly logger: Logger,
    private readonly dateService: DateService,
    private readonly prismaService: PrismaService,
  ) {}

  async findCohort(id: number): Promise<CohortAdminItem> {
    const cohort = await this.prismaService.cohort.findUniqueOrThrow({
      where: { id },
      include: {
        windows: { orderBy: { startAt: 'desc' } },
        students: { include: { user: true, exclusion: true } },
      },
    });
    return {
      id: cohort.id,
      name: cohort.name,
      coursemologyUrl: cohort.coursemologyUrl,
      windows: cohort.windows.map(makeWindowBase),
      students: cohort.students.map((student) => ({
        ...makeStudentBaseWithId(student),
        joinedAt: student.user.createdAt,
        isExcluded: student.exclusion != null,
      })),
    };
  }

  async createCohort(dto: CreateCohortDto): Promise<{ id: number }> {
    return this.prismaService.cohort
      .create({
        data: {
          name: dto.name,
          coursemologyUrl: dto.coursemologyUrl,
        },
      })
      .then((result) => ({ id: result.id }));
  }

  async updateCohort(
    id: number,
    dto: UpdateCohortDto,
  ): Promise<CohortAdminUpdateResult> {
    return this.prismaService.cohort
      .update({
        where: { id },
        data: {
          name: dto.name.trim(),
          coursemologyUrl: dto.coursemologyUrl.trim(),
        },
      })
      .then((result) => ({
        name: result.name,
        coursemologyUrl: result.coursemologyUrl,
      }));
  }

  async createWindow(
    cohortId: number,
    dto: CreateWindowDto,
  ): Promise<WindowBase> {
    const startAt = this.dateService.findStartOfDay(dto.startAt);
    const endAt = this.dateService.findEndOfDay(dto.endAt);
    return this.prismaService.$transaction(async (tx) => {
      if (!this.isValidWindow(tx, cohortId, null, startAt, endAt)) {
        throw new Error('Invalid window!');
      }
      const window = await tx.window.create({
        data: { ...dto, cohortId, startAt, endAt },
      });
      await this.matchForWindow(tx, window);
      return makeWindowBase(window);
    });
  }

  async updateWindow(
    cohortId: number,
    dto: UpdateWindowDto,
  ): Promise<WindowBase> {
    const startAt = this.dateService.findStartOfDay(dto.startAt);
    const endAt = this.dateService.findEndOfDay(dto.endAt);
    return this.prismaService.$transaction(async (tx) => {
      if (!this.isValidWindow(tx, cohortId, dto.id, startAt, endAt)) {
        throw new Error('Invalid window!');
      }
      const existingWindow = await tx.window.findUniqueOrThrow({
        where: { id: dto.id, cohortId },
      });
      if (
        existingWindow.startAt.getTime() === startAt.getTime() &&
        existingWindow.endAt.getTime() === endAt.getTime()
      ) {
        // Only need to update requirements, which is fast
        this.logger.log('Only updating requirements', CohortsAdminService.name);
        const window = await tx.window.update({
          where: { id: existingWindow.id },
          data: {
            numQuestions: dto.numQuestions,
            requireInterview: dto.requireInterview,
          },
        });
        return makeWindowBase(window);
      }
      // Otherwise, we need to update the window period + re-match records
      this.logger.log('Updating window completely', CohortsAdminService.name);
      const window = await tx.window.update({
        where: { id: existingWindow.id },
        data: { ...dto, startAt, endAt },
      });
      // Naive implementation, which is to unmatch and rematch.
      // TODO: Explore a better solution than this.
      await this.unmatchForWindow(tx, window);
      await this.matchForWindow(tx, window);
      return makeWindowBase(window);
    });
  }

  async validateStudents(
    id: number,
    dto: CreateStudentDto[],
  ): Promise<CohortStudentValidationResult> {
    return this.validateAndMaybeCreateUser(id, dto, false);
  }

  async createStudents(
    id: number,
    dto: CreateStudentDto[],
  ): Promise<CohortStudentValidationResult> {
    return this.validateAndMaybeCreateUser(id, dto, true);
  }

  private async validateAndMaybeCreateUser(
    cohortId: number,
    dto: CreateStudentDto[],
    shouldCreate: boolean,
  ): Promise<CohortStudentValidationResult> {
    const success: CohortStudentValidationResult['success'] = [];
    const error: CohortStudentValidationResult['error'] = [];
    let windows: Window[] = [];
    if (shouldCreate) {
      windows = await this.prismaService.window.findMany({
        where: { cohortId },
      });
    }

    await Promise.all(
      dto.map(async (student) => {
        if (
          !student.coursemologyName ||
          !student.coursemologyProfileUrl ||
          !student.githubUsername
        ) {
          error.push({ ...student, error: 'INVALID DATA' });
          return;
        }
        const matchedUser = await this.prismaService.user.findFirst({
          where: {
            githubUsername: {
              equals: student.githubUsername,
              mode: 'insensitive',
            },
          },
        });
        if (matchedUser == null) {
          error.push({ ...student, error: 'NOT FOUND' });
          return;
        }
        const existingStudent = await this.prismaService.student.findUnique({
          where: { userId_cohortId: { userId: matchedUser.id, cohortId } },
        });
        if (existingStudent != null) {
          error.push({ ...student, error: 'ALREADY ADDED' });
          return;
        }
        if (shouldCreate) {
          return this.prismaService
            .$transaction(async (tx) => {
              const createdStudent = await tx.student.create({
                data: {
                  userId: matchedUser.id,
                  cohortId,
                  coursemologyName: student.coursemologyName,
                  coursemologyProfileUrl: student.coursemologyProfileUrl,
                },
              });
              return this.matchForNewStudent(tx, createdStudent, windows);
            })
            .then(() => {
              success.push(makeStudentBase({ ...student, user: matchedUser }));
            })
            .catch((e) => {
              this.logger.error(
                'Error occurred while creating student',
                e instanceof Error ? e.stack : undefined,
                CohortsAdminService.name,
              );
              error.push({ ...student, error: 'INVALID DATA' });
            });
        } else {
          success.push(makeStudentBase({ ...student, user: matchedUser }));
        }
      }),
    );
    return { success, error };
  }

  private async matchForNewStudent(
    tx: Transaction,
    student: Student,
    windows: Window[],
  ): Promise<void> {
    const studentResults = await Promise.all(
      windows.map((window) =>
        tx.studentResult.create({
          data: { windowId: window.id, studentId: student.id },
          include: { window: true, student: true },
        }),
      ),
    );
    return this.matchForStudentResults(tx, studentResults);
  }

  private async matchForWindow(tx: Transaction, window: Window): Promise<void> {
    const students = await tx.student.findMany({
      where: { cohortId: window.cohortId },
    });
    const studentResults = await Promise.all(
      students.map((student) =>
        tx.studentResult.upsert({
          where: {
            studentId_windowId: { studentId: student.id, windowId: window.id },
          },
          create: { studentId: student.id, windowId: window.id },
          update: { studentId: student.id, windowId: window.id },
          include: { window: true, student: true },
        }),
      ),
    );
    return this.matchForStudentResults(tx, studentResults);
  }

  private async matchForStudentResults(
    tx: Transaction,
    studentResults: (StudentResult & { window: Window; student: Student })[],
  ): Promise<void> {
    await Promise.all(
      studentResults.map((studentResult) =>
        Promise.all([
          tx.questionSubmission.updateMany({
            data: { studentResultId: studentResult.id },
            where: {
              studentResultId: null,
              userId: studentResult.student.userId,
              createdAt: {
                gte: studentResult.window.startAt,
                lte: studentResult.window.endAt,
              },
            },
          }),
          tx.roomRecordUser.updateMany({
            data: { studentResultId: studentResult.id },
            where: {
              studentResultId: null,
              userId: studentResult.student.userId,
              roomRecord: {
                isValid: true,
                room: {
                  closedAt: {
                    gte: studentResult.window.startAt,
                    lte: studentResult.window.endAt,
                  },
                },
              },
            },
          }),
        ]),
      ),
    );
  }

  private async unmatchForWindow(
    tx: Transaction,
    window: Window,
  ): Promise<void> {
    const studentResults = await tx.studentResult.findMany({
      where: { windowId: window.id },
    });
    await Promise.all(
      studentResults.map(async (studentResult) => {
        return Promise.all([
          tx.questionSubmission.updateMany({
            where: { studentResultId: studentResult.id },
            data: { studentResultId: null },
          }),
          tx.roomRecordUser.updateMany({
            where: { studentResultId: studentResult.id },
            data: { studentResultId: null },
          }),
        ]);
      }),
    );
  }

  private async isValidWindow(
    tx: Transaction,
    cohortId: number,
    windowId: number | null,
    startAt: Date,
    endAt: Date,
  ): Promise<boolean> {
    if (startAt >= endAt) {
      return false;
    }
    const otherWindows = await tx.window.findMany({
      where: {
        cohortId,
        ...(windowId != null ? { id: { not: windowId } } : {}),
      },
    });
    return otherWindows.every(
      (window) =>
        // Either this new window is completely before the existing one
        (startAt < window.startAt && endAt < window.startAt) ||
        // Or it's completely after the existing one
        (startAt > window.endAt && endAt > window.endAt),
    );
  }
}
