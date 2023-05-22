import { Injectable, Logger } from '@nestjs/common';

import { UserRole } from '../../../infra/prisma/generated';
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

  async findCohorts(
    userId: string,
    userRole: UserRole,
  ): Promise<CohortListItem[]> {
    let cohorts;
    if (userRole === UserRole.ADMIN) {
      cohorts = {
        ...(await this.prismaService.cohort.findMany({
          include: { windows: { orderBy: { startAt: 'asc' } } },
        })),
        exclusion: null,
      };
    } else {
      const students = await this.prismaService.student.findMany({
        where: { userId },
        include: {
          cohort: { include: { windows: { orderBy: { startAt: 'asc' } } } },
          exclusion: true,
        },
      });
      cohorts = students.map((student) => ({
        ...student.cohort,
        exclusion: student.exclusion,
      }));
    }

    const now = new Date();
    return cohorts.map((cohort) => {
      const { id, name, windows, exclusion } = cohort;
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

  async findCohort(
    id: number,
    userId: string,
    userRole: UserRole,
  ): Promise<CohortItem> {
    if (userRole === UserRole.ADMIN) {
      return this.findCohortForAdmin(id, userId);
    }
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

  private async findCohortForAdmin(
    id: number,
    userId: string,
  ): Promise<CohortItem> {
    const cohort = await this.prismaService.cohort.findUnique({
      where: { id },
      include: { windows: { orderBy: { startAt: 'asc' } } },
    });
    if (cohort == null) {
      this.logger.error(
        'Invalid cohort accessed',
        undefined,
        CohortsService.name,
      );
      throw new Error('Invalid cohort accessed');
    }
    const windows = await Promise.all(
      cohort.windows.map(async (window) => {
        const submissions = await this.prismaService.questionSubmission
          .findMany({
            where: {
              userId,
              createdAt: { gte: window.startAt, lte: window.endAt },
            },
            include: { question: true },
          })
          .then((questionSubmissions) =>
            questionSubmissions.map(makeSubmissionBase),
          );
        const interviews = await this.prismaService.roomRecord
          .findMany({
            where: { roomRecordUsers: { some: { userId } }, isValid: true },
            include: { roomRecordUsers: { include: { user: true } } },
          })
          .then((roomRecords) =>
            roomRecords.map((roomRecord) =>
              makeInterviewBase(roomRecord, userId),
            ),
          );
        const hasCompletedQuestions = submissions.length >= window.numQuestions;
        const hasCompletedInterview =
          !window.requireInterview || interviews.length > 0;
        return {
          ...makeWindowBase(window),
          exclusion: null,
          previouslyExcluded: false,
          hasCompletedQuestions,
          hasCompletedInterview,
          submissions,
          interviews,
        };
      }),
    );
    return { name: cohort.name, coursemologyUrl: '', windows };
  }
}
