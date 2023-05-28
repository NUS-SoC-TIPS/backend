import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  makeInterviewBase,
  makeStudentBaseWithId,
  makeSubmissionBase,
  makeWindowBase,
} from '../../interfaces';

import { WindowItem } from './windows.interfaces';

@Injectable()
export class WindowsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findWindow(id: number): Promise<WindowItem> {
    const window = await this.prismaService.window.findUniqueOrThrow({
      where: { id },
      include: {
        studentResults: {
          include: {
            questionSubmissions: { include: { question: true } },
            roomRecordUsers: {
              include: {
                roomRecord: {
                  include: { roomRecordUsers: { include: { user: true } } },
                },
              },
            },
            student: {
              include: { user: true, exclusion: { include: { window: true } } },
            },
          },
        },
      },
    });

    // Filter out students that were previously excluded
    const studentResults = window.studentResults.filter(
      (studentResult) =>
        studentResult.student.exclusion == null ||
        studentResult.student.exclusion.window.startAt >= window.startAt,
    );
    return {
      ...makeWindowBase(window),
      cohortId: window.cohortId,
      students: studentResults.map((studentResult) => {
        const { student, questionSubmissions, roomRecordUsers } = studentResult;
        return {
          ...makeStudentBaseWithId(student),
          submissions: questionSubmissions.map(makeSubmissionBase),
          interviews: roomRecordUsers.map((roomRecordUser) =>
            makeInterviewBase(roomRecordUser.roomRecord, student.userId),
          ),
          hasCompletedWindow:
            questionSubmissions.length >= window.numQuestions &&
            (!window.requireInterview || roomRecordUsers.length >= 1),
          exclusion:
            student.exclusion != null &&
            student.exclusion.windowId === window.id
              ? {
                  id: student.exclusion.id,
                  reason: student.exclusion.reason,
                }
              : null,
        };
      }),
    };
  }

  async deleteWindow(id: number): Promise<void> {
    await this.prismaService.window.delete({ where: { id } });
  }
}
