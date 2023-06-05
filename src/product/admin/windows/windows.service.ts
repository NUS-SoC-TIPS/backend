import { Injectable } from '@nestjs/common';

import { Student, User } from '../../../infra/prisma/generated';
import { TRANSACTION_OPTIONS } from '../../../infra/prisma/prisma.constants';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  makeInterviewBase,
  makeStudentBase,
  makeStudentBaseWithId,
  makeSubmissionBase,
  makeWindowBase,
} from '../../interfaces';

import {
  BOTH_REASON,
  INTERVIEW_REASON,
  QUESTIONS_REASON,
} from './windows.constants';
import { WindowItem } from './windows.interfaces';

@Injectable()
export class WindowsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findWindow(id: number): Promise<WindowItem> {
    const window = await this.prismaService.window.findUniqueOrThrow({
      where: { id },
      include: {
        pairings: {
          include: {
            pairingStudents: {
              include: { student: { include: { user: true } } },
            },
          },
        },
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

    const studentIdToPartnerMap = new Map<number, Student & { user: User }>();
    window.pairings.forEach((pairing) => {
      const [studentOne, studentTwo] = pairing.pairingStudents;
      studentIdToPartnerMap.set(studentOne.studentId, studentTwo.student);
      studentIdToPartnerMap.set(studentTwo.studentId, studentOne.student);
    });

    return {
      ...makeWindowBase(window),
      cohortId: window.cohortId,
      students: studentResults.map((studentResult) => {
        const { student, questionSubmissions, roomRecordUsers } = studentResult;
        const partner = studentIdToPartnerMap.get(student.id);
        return {
          ...makeStudentBaseWithId(student),
          submissions: questionSubmissions.map(makeSubmissionBase),
          interviews: roomRecordUsers.map((roomRecordUser) =>
            makeInterviewBase(roomRecordUser.roomRecord, student.userId),
          ),
          pairedPartner: partner != null ? makeStudentBase(partner) : null,
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

  async autoExclude(id: number): Promise<number> {
    const studentResults = await this.prismaService.studentResult.findMany({
      where: { windowId: id },
      include: {
        student: { include: { exclusion: { include: { window: true } } } },
        window: true,
        _count: {
          select: { questionSubmissions: true, roomRecordUsers: true },
        },
      },
    });
    let numExcluded = 0;
    await this.prismaService.$transaction(async (tx) => {
      await Promise.all(
        studentResults.map(async (studentResult) => {
          const { student, window, _count } = studentResult;
          const existingExclusion = student.exclusion;
          if (
            existingExclusion &&
            existingExclusion.window.startAt <= window.startAt
          ) {
            // Exclusion exists for an earlier window
            return;
          }
          if (
            _count.questionSubmissions >= window.numQuestions &&
            (!window.requireInterview || _count.roomRecordUsers >= 1)
          ) {
            // Student has met the necessary requirements
            return;
          }
          let reason: string;
          if (
            _count.questionSubmissions < window.numQuestions &&
            window.requireInterview &&
            _count.roomRecordUsers === 0
          ) {
            reason = BOTH_REASON;
          } else if (_count.questionSubmissions < window.numQuestions) {
            reason = QUESTIONS_REASON;
          } else {
            reason = INTERVIEW_REASON;
          }

          if (existingExclusion) {
            await tx.exclusion.update({
              data: { windowId: id, reason },
              where: { id: existingExclusion.id },
            });
            numExcluded += 1;
          } else {
            await tx.exclusion.create({
              data: { studentId: student.id, windowId: id, reason },
            });
            numExcluded += 1;
          }
        }),
      );
    }, TRANSACTION_OPTIONS);
    return numExcluded;
  }
}
