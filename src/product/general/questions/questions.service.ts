import { Injectable, Logger } from '@nestjs/common';

import { DateService } from '../../../infra/date/date.service';
import { Student, Window } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CurrentService } from '../../../productinfra/current/current.service';
import {
  makeQuestionListItem,
  makeSubmissionItem,
  makeSubmissionListItem,
  QuestionListItem,
  SubmissionItem,
  SubmissionListItem,
} from '../../interfaces';

import { CreateSubmissionDto, UpdateSubmissionDto } from './dtos';
import {
  QuestionStats,
  QuestionStatsLanguageBreakdown,
  QuestionStatsProgress,
} from './questions.interfaces';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly logger: Logger,
    private readonly dateService: DateService,
    private readonly prismaService: PrismaService,
    private readonly currentService: CurrentService,
  ) {}

  findAllQuestions(): Promise<QuestionListItem[]> {
    return this.prismaService.question
      .findMany({
        select: {
          name: true,
          source: true,
          difficulty: true,
          slug: true,
          type: true,
        },
      })
      .then((questions) =>
        questions.map((question) => makeQuestionListItem(question)),
      );
  }

  async findStats(userId: string): Promise<QuestionStats> {
    const progress = await this.findProgress(userId);
    const latestSubmission = await this.findLatestSubmission(userId);
    const languageBreakdown = await this.findLanguageBreakdown(userId);
    return { progress, latestSubmission, languageBreakdown };
  }

  async createSubmission(
    dto: CreateSubmissionDto,
    userId: string,
  ): Promise<{ id: number }> {
    dto.codeWritten = dto.codeWritten.trim();
    return this.prismaService.questionSubmission
      .create({ data: { ...dto, userId } })
      .then((questionSubmission) => {
        return this.currentService.maybeAddQuestionSubmissionToResult(
          questionSubmission,
        );
      })
      .then((questionSubmission) => ({ id: questionSubmission.id }));
  }

  // TODO: Add pagination
  async findSubmissions(userId: string): Promise<SubmissionListItem[]> {
    const submissions = await this.prismaService.questionSubmission.findMany({
      where: { userId },
      include: { question: true },
      orderBy: { createdAt: 'desc' },
    });
    return submissions.map(makeSubmissionListItem);
  }

  async findSubmission(id: number, userId: string): Promise<SubmissionItem> {
    const submission = await this.prismaService.questionSubmission.findFirst({
      where: { id, userId },
      include: { question: true },
    });
    if (submission == null) {
      this.logger.error(
        'Invalid submission accessed',
        undefined,
        QuestionsService.name,
      );
      throw new Error('Invalid submission accessed');
    }
    return makeSubmissionItem(submission);
  }

  async updateSubmission(
    id: number,
    dto: UpdateSubmissionDto,
    userId: string,
  ): Promise<{ codeWritten: string }> {
    const submission = await this.prismaService.questionSubmission.findFirst({
      where: { id, userId },
    });
    if (submission == null) {
      this.logger.error(
        'Invalid submission accessed',
        undefined,
        QuestionsService.name,
      );
      throw new Error('Invalid submission accessed');
    }
    if (dto.codeWritten) {
      dto.codeWritten = dto.codeWritten.trim();
    }
    return await this.prismaService.questionSubmission
      .update({
        where: { id },
        data: { ...dto },
      })
      .then((questionSubmission) => ({
        codeWritten: questionSubmission.codeWritten,
      }));
  }

  async deleteSubmission(id: number, userId: string): Promise<void> {
    const submission = await this.prismaService.questionSubmission.findFirst({
      where: { id, userId },
    });
    if (submission == null) {
      this.logger.error(
        'Invalid submission accessed',
        undefined,
        QuestionsService.name,
      );
      throw new Error('Invalid submission accessed');
    }
    await this.prismaService.questionSubmission.delete({ where: { id } });
  }

  private async findProgress(userId: string): Promise<QuestionStatsProgress> {
    const ongoingWindow = await this.currentService.findOngoingWindow();
    if (ongoingWindow != null) {
      const student = await this.prismaService.student.findUnique({
        where: {
          userId_cohortId: { userId, cohortId: ongoingWindow?.cohortId },
        },
      });
      if (student != null) {
        return this.findWindowProgress(student, ongoingWindow);
      }
    }
    return this.findWeekProgress(userId);
  }

  private async findWindowProgress(
    student: Student,
    window: Window,
  ): Promise<QuestionStatsProgress> {
    const studentResultWithSubmissionCount =
      await this.prismaService.studentResult.findFirst({
        where: { studentId: student.id, windowId: window.id },
        include: { _count: { select: { questionSubmissions: true } } },
      });
    return {
      numSubmissionsThisWindowOrWeek:
        studentResultWithSubmissionCount?._count?.questionSubmissions ?? 0,
      numSubmissionsRequired: window.numQuestions,
      startOfWindowOrWeek: window.startAt,
      endOfWindowOrWeek: window.endAt,
      isWindow: true,
    };
  }

  private async findWeekProgress(
    userId: string,
  ): Promise<QuestionStatsProgress> {
    const startOfWeek = this.dateService.findStartOfWeek();
    const endOfWeek = this.dateService.findEndOfWeek();
    const numSubmissionsThisWeek =
      await this.prismaService.questionSubmission.count({
        where: {
          userId,
          createdAt: { gte: startOfWeek, lte: endOfWeek },
        },
      });
    return {
      numSubmissionsThisWindowOrWeek: numSubmissionsThisWeek,
      numSubmissionsRequired: null,
      startOfWindowOrWeek: startOfWeek,
      endOfWindowOrWeek: endOfWeek,
      isWindow: false,
    };
  }

  private async findLatestSubmission(
    userId: string,
  ): Promise<SubmissionListItem | null> {
    return this.prismaService.questionSubmission
      .findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { question: true },
      })
      .then((latestSubmission) =>
        latestSubmission != null
          ? makeSubmissionListItem(latestSubmission)
          : null,
      );
  }

  private async findLanguageBreakdown(
    userId: string,
  ): Promise<QuestionStatsLanguageBreakdown> {
    const submissionAggregate =
      await this.prismaService.questionSubmission.groupBy({
        by: ['languageUsed'],
        _count: true,
        where: { userId },
      });
    const breakdown = {};
    submissionAggregate.forEach((languageWithCount) => {
      breakdown[languageWithCount.languageUsed] = languageWithCount._count;
    });
    return breakdown;
  }
}
