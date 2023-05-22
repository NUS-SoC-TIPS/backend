import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  makeInterviewBase,
  makeSubmissionBase,
  makeWindowBase,
} from '../../interfaces';

import { CohortItem, CohortListItem } from './cohorts.interfaces';

@Injectable()
export class CohortsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  async findCohorts(userId: string): Promise<CohortListItem[]> {
    const students = await this.prismaService.student.findMany({
      where: { userId },
      include: {
        cohort: { include: { windows: { orderBy: { startAt: 'asc' } } } },
        exclusion: true,
      },
    });

    const now = new Date();
    return students.map((student) => {
      const {
        cohort: { id, name, windows },
        exclusion,
      } = student;
      const startAt = windows[0].startAt;
      const endAt = windows[windows.length - 1].endAt;
      let status;
      if (exclusion != null) {
        status = 'FAILED';
      } else if (now < startAt) {
        status = 'HAS NOT STARTED';
      } else if (now > endAt) {
        status = 'COMPLETED';
      } else {
        status = 'IN PROGRESS';
      }
      return { id, name, startAt, endAt, status };
    });
  }

  async findCohort(id: number, userId: string): Promise<CohortItem> {
    const student = await this.prismaService.student.findUnique({
      where: { userId_cohortId: { userId, cohortId: id } },
      include: {
        cohort: true,
        exclusion: { include: { window: true } },
        results: {
          include: {
            window: true,
            questionSubmissions: { include: { question: true } },
            roomRecordUsers: {
              include: {
                roomRecord: {
                  include: { roomRecordUsers: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
    });
    if (student == null) {
      this.logger.error(
        'Invalid cohort accessed',
        undefined,
        CohortsService.name,
      );
      throw new Error('Invalid cohort accessed');
    }

    const { exclusion, results, cohort } = student;
    const windows = results
      .sort((a, b) => a.window.startAt.getTime() - b.window.startAt.getTime())
      .map((result) => {
        const { questionSubmissions, roomRecordUsers, window } = result;
        const submissions = questionSubmissions.map(makeSubmissionBase);
        const interviews = roomRecordUsers.map((roomRecordUser) =>
          makeInterviewBase(roomRecordUser.roomRecord, userId),
        );
        const exclusionForThisWindow =
          exclusion?.windowId === window.id
            ? { reason: exclusion.reason }
            : null;
        const hasCompletedQuestions = submissions.length >= window.numQuestions;
        const hasCompletedInterview =
          !window.requireInterview || interviews.length > 0;
        const previouslyExcluded =
          exclusion != null ? window.startAt > exclusion.window.endAt : false;

        return {
          ...makeWindowBase(window),
          exclusion: exclusionForThisWindow,
          previouslyExcluded,
          hasCompletedQuestions,
          hasCompletedInterview,
          submissions,
          interviews,
        };
      });
    return { name: cohort.name, coursemologyUrl: '', windows };
  }
}
