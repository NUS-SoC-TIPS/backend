import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { makeUserBase, makeWindowBase } from '../../interfaces';

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
            _count: {
              select: { questionSubmissions: true, roomRecordUsers: true },
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
        const { student, _count } = studentResult;
        return {
          ...makeUserBase(student.user),
          studentId: student.id,
          coursemologyName: student.coursemologyName,
          coursemologyProfileUrl: student.coursemologyProfileUrl,
          numSubmissions: _count.questionSubmissions,
          numInterviews: _count.roomRecordUsers,
          exclusion:
            student.exclusion != null
              ? { id: student.exclusion.id, reason: student.exclusion.reason }
              : null,
        };
      }),
    };
  }
}
