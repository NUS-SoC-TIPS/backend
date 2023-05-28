import { Injectable, Logger } from '@nestjs/common';

import { DateService } from '../../../infra/date/date.service';
import { Window } from '../../../infra/prisma/generated';
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
      // TODO: Validate the DTO data relative to existing windows
      const window = await tx.window.create({
        data: { ...dto, cohortId, startAt, endAt },
      });
      // TODO: Create records + do matching
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
      // TODO: Validate the DTO data relative to existing windows
      const existingWindow = await tx.window.findUniqueOrThrow({
        where: { id: dto.id, cohortId },
      });
      if (
        existingWindow.startAt === startAt &&
        existingWindow.endAt === endAt
      ) {
        // Only need to update requirements, which is fast
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
      const window = await tx.window.update({
        where: { id: existingWindow.id },
        data: { ...dto, startAt, endAt },
      });
      // TODO: Create records + do matching
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
              const studentResults = await Promise.all(
                windows.map((window) =>
                  tx.studentResult.create({
                    data: { windowId: window.id, studentId: createdStudent.id },
                    include: { window: true },
                  }),
                ),
              );
              await Promise.all(
                studentResults.map((studentResult) =>
                  Promise.all([
                    tx.questionSubmission.updateMany({
                      data: {
                        studentResultId: studentResult.id,
                      },
                      where: {
                        studentResultId: null,
                        userId: matchedUser.id,
                        createdAt: {
                          gte: studentResult.window.startAt,
                          lte: studentResult.window.endAt,
                        },
                      },
                    }),
                    tx.roomRecordUser.updateMany({
                      data: {
                        studentResultId: studentResult.id,
                      },
                      where: {
                        studentResultId: null,
                        userId: matchedUser.id,
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
}
