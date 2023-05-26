import { Injectable, Logger } from '@nestjs/common';
import { Window } from 'src/infra/prisma/generated';
import { findEndOfDay, findStartOfDay } from 'src/utils';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { makeUserBase, makeWindowBase } from '../../../product/interfaces';

import {
  CohortAdminItem,
  CohortAdminUpdateResult,
  CohortStudentValidationResult,
} from './cohorts-admin.interfaces';
import {
  CreateCohortDto,
  CreateStudentDto,
  CreateUpdateWindowsDto,
  UpdateCohortDto,
} from './dtos';

@Injectable()
export class CohortsAdminService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  async findCohort(id: number): Promise<CohortAdminItem> {
    const cohort = await this.prismaService.cohort.findUniqueOrThrow({
      where: { id },
      include: {
        windows: { orderBy: { startAt: 'asc' } },
        students: { include: { user: true, exclusion: true } },
      },
    });
    return {
      id: cohort.id,
      name: cohort.name,
      coursemologyUrl: cohort.coursemologyUrl,
      windows: cohort.windows.map(makeWindowBase),
      students: cohort.students.map((student) => ({
        ...makeUserBase(student.user),
        studentId: student.id,
        joinedAt: student.user.createdAt,
        coursemologyName: student.coursemologyName,
        coursemologyProfileUrl: student.coursemologyProfileUrl,
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

  async createOrUpdateWindows(
    cohortId: number,
    dto: CreateUpdateWindowsDto,
  ): Promise<void> {
    const { windows } = dto;
    windows.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    if (!this.areWindowsValid(windows)) {
      throw new Error('Windows are overlapping!');
    }

    const windowsToCreate: {
      cohortId: number;
      startAt: Date;
      endAt: Date;
      numQuestions: number;
      requireInterview: boolean;
    }[] = [];
    const windowsToUpdate: {
      id: number;
      cohortId: number;
      startAt: Date;
      endAt: Date;
      numQuestions: number;
      requireInterview: boolean;
    }[] = [];
    windows.forEach((window) => {
      window.startAt = findStartOfDay(window.startAt);
      window.endAt = findEndOfDay(window.endAt);
      const { id } = window;
      if (id == null) {
        windowsToCreate.push({ ...window, cohortId });
      } else {
        windowsToUpdate.push({ ...window, id, cohortId });
      }
    });

    await this.prismaService.$transaction(async (tx) => {
      await tx.window.createMany({
        data: windowsToCreate,
      });
      await Promise.all(
        windowsToUpdate.map(async (window) => {
          const originalWindow = await tx.window.findUniqueOrThrow({
            where: { id: window.id },
          });
          if (
            window.startAt === originalWindow.startAt &&
            window.endAt === originalWindow.endAt &&
            window.numQuestions === originalWindow.numQuestions &&
            window.requireInterview === originalWindow.requireInterview
          ) {
            this.logger.debug(
              `No change to window with ID: ${window.id} found. Skipping update.`,
              CohortsAdminService.name,
            );
            return;
          }
          if (
            window.startAt === originalWindow.startAt &&
            window.endAt === originalWindow.endAt
          ) {
            this.logger.log(
              `Only requirement change to window with ID: ${window.id} found.`,
              CohortsAdminService.name,
            );
            await tx.window.update({
              where: { id: window.id },
              data: {
                numQuestions: window.numQuestions,
                requireInterview: window.requireInterview,
              },
            });
            // No need to handle submissions/records.
            return;
          }

          // TODO: Update then re-pair submissions/records.
          throw new Error('Incomplete');
        }),
      );
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

  private areWindowsValid(windows: { startAt: Date; endAt: Date }[]): boolean {
    for (let i = 0; i < windows.length; i++) {
      const currentWindow = windows[i];
      if (currentWindow.endAt <= currentWindow.startAt) {
        return false;
      }
      if (i === 0) {
        continue;
      }
      const previousWindow = windows[i - 1];
      if (currentWindow.startAt <= previousWindow.endAt) {
        return false;
      }
    }
    return true;
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
              success.push({
                ...makeUserBase(matchedUser),
                coursemologyName: student.coursemologyName,
                coursemologyProfileUrl: student.coursemologyProfileUrl,
              });
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
          success.push({
            ...makeUserBase(matchedUser),
            coursemologyName: student.coursemologyName,
            coursemologyProfileUrl: student.coursemologyProfileUrl,
          });
        }
      }),
    );
    return { success, error };
  }
}
