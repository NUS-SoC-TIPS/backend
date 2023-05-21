import { Injectable } from '@nestjs/common';
import { transformRoomRecord } from 'src/utils';

import { Exclusion, Window } from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WindowsService } from '../../productinfra/windows/windows.service';

import { CreateExclusionDto } from './dtos';
import { AdminStatsEntity } from './entities';

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly windowsService: WindowsService,
  ) {}

  async createExclusion(dto: CreateExclusionDto): Promise<Exclusion> {
    const window = await this.windowsService.findOrThrow(dto.windowId);
    const student = await this.prismaService.student.findUnique({
      where: { id: dto.studentId },
      include: { exclusion: { include: { window: true } } },
    });
    if (!student) {
      throw new Error('Student does not exist');
    }

    const existingExclusion = student.exclusion;
    if (
      existingExclusion &&
      existingExclusion.window.startAt <= window.startAt
    ) {
      return existingExclusion;
    }

    dto.reason = dto.reason.trim();

    if (existingExclusion) {
      // Update if we're going for an earlier exclusion than the existing one for
      // the same cohort.
      return this.prismaService.exclusion.update({
        data: { windowId: dto.windowId, reason: dto.reason },
        where: { id: existingExclusion.id },
      });
    }

    return await this.prismaService.exclusion.create({ data: { ...dto } });
  }

  async removeExclusion(exclusionId: number): Promise<void> {
    await this.prismaService.exclusion.delete({ where: { id: exclusionId } });
  }

  async findWindows(): Promise<Window[]> {
    // TODO: Replace the hardcoded cohort ID with a variable one
    return this.prismaService.window.findMany({
      where: { cohortId: 1, startAt: { lte: new Date() } },
      orderBy: { startAt: 'asc' },
    });
  }

  async findStats(windowId: number): Promise<AdminStatsEntity> {
    const window = await this.windowsService.findOrThrow(windowId);
    const studentResults = await this.prismaService.studentResult.findMany({
      where: { windowId: window.id },
      include: {
        student: {
          include: { user: true, exclusion: { include: { window: true } } },
        },
        questionSubmissions: { include: { question: true } },
        roomRecordUsers: {
          include: {
            roomRecord: {
              include: { roomRecordUsers: { include: { user: true } } },
            },
          },
        },
      },
    });

    const students = studentResults.map((result) => ({
      ...result.student.user,
      studentId: result.studentId,
      coursemologyName: result.student.coursemologyName,
      coursemologyProfileUrl: result.student.coursemologyProfileUrl,
      submissions: result.questionSubmissions,
      records: result.roomRecordUsers.map((roomRecordUser) =>
        transformRoomRecord(roomRecordUser.roomRecord, roomRecordUser.userId),
      ),
      hasCompletedWindow:
        result.questionSubmissions.length >= window.numQuestions &&
        (!window.requireInterview || result.roomRecordUsers.length > 0),
      exclusion: result.student.exclusion,
    }));

    const numberOfStudents = studentResults.length;
    const totalNumberOfQuestions = studentResults
      .map((student) => student.questionSubmissions.length)
      .reduce((acc, count) => acc + count, 0);
    const averageNumberOfQuestions =
      numberOfStudents === 0 ? 0 : totalNumberOfQuestions / numberOfStudents;

    return {
      ...window,
      numberOfStudents,
      numberOfCompletedStudents: students.filter((s) => s.hasCompletedWindow)
        .length,
      averageNumberOfQuestions,
      students,
      nonStudents: [],
      excludedStudents: [],
    };
  }
}
