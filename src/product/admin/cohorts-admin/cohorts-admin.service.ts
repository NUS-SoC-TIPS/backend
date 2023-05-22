import { Injectable, Logger } from '@nestjs/common';
import { Window } from 'src/infra/prisma/generated';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { makeUserBase, makeWindowBase } from '../../../product/interfaces';

import {
  CohortAdminItem,
  CohortStudentValidationResult,
} from './cohorts-admin.interfaces';
import { CreateStudentDto, CreateUpdateCohortDto } from './dtos';

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
      name: cohort.name,
      coursemologyUrl: '',
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

  async createOrUpdateCohort(dto: CreateUpdateCohortDto): Promise<void> {
    // TODO: Add validation
    if (dto.id == null) {
      return this.createCohort(dto);
    } else {
      return this.updateCohort(dto, dto.id);
    }
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

  private async createCohort(dto: CreateUpdateCohortDto): Promise<void> {
    await this.prismaService.cohort.create({
      data: {
        name: dto.name,
        windows: {
          create: dto.windows.map((window) => ({
            numQuestions: window.numQuestions,
            requireInterview: window.requireInterview,
            startAt: window.startAt,
            endAt: window.endAt,
          })),
        },
      },
    });
  }

  private async updateCohort(
    dto: CreateUpdateCohortDto,
    cohortId: number,
  ): Promise<void> {
    const cohort = await this.prismaService.cohort.update({
      where: { id: cohortId },
      data: { name: dto.name },
      include: { students: true },
    });
    await Promise.all(
      dto.windows.map(async (window) => {
        if (window.id == null) {
          const newWindow = await this.prismaService.window.create({
            data: {
              numQuestions: window.numQuestions,
              requireInterview: window.requireInterview,
              startAt: window.startAt,
              endAt: window.endAt,
              cohortId,
            },
          });
          await this.prismaService.studentResult.createMany({
            data: cohort.students.map((student) => ({
              studentId: student.id,
              windowId: newWindow.id,
            })),
          });
        } else {
          // We'll just blindly do an update for now.
          await this.prismaService.window.update({
            where: { id: window.id },
            data: {
              numQuestions: window.numQuestions,
              requireInterview: window.requireInterview,
              startAt: window.startAt,
              endAt: window.endAt,
            },
          });
        }
      }),
    );
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
              await tx.studentResult.createMany({
                data: windows.map((window) => ({
                  windowId: window.id,
                  studentId: createdStudent.id,
                })),
              });
              const studentResults = await tx.studentResult.findMany({
                where: { studentId: createdStudent.id },
                include: { window: true },
              });
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
