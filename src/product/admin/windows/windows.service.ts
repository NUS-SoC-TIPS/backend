import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  makeInterviewBase,
  makeSubmissionBase,
  makeUserBase,
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
      students: studentResults.map((studentResult) => {
        const { student, questionSubmissions, roomRecordUsers } = studentResult;
        return {
          ...makeUserBase(student.user),
          studentId: student.id,
          coursemologyName: student.coursemologyName,
          coursemologyProfileUrl: student.coursemologyProfileUrl,
          submissions: questionSubmissions.map(makeSubmissionBase),
          interviews: roomRecordUsers.map((roomRecordUser) =>
            makeInterviewBase(roomRecordUser.roomRecord, student.userId),
          ),
          exclusion:
            student.exclusion != null
              ? { id: student.exclusion.id, reason: student.exclusion.reason }
              : null,
        };
      }),
    };
  }
}
