import { Injectable, Logger } from '@nestjs/common';

import { Window } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CurrentService } from '../../../productinfra/current/current.service';
import { findEndOfWeek, findStartOfWeek } from '../../../utils';
import {
  makeQuestionBase,
  makeSubmissionItem,
  QuestionBase,
  SubmissionItem,
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
    private readonly prismaService: PrismaService,
    private readonly currentService: CurrentService,
  ) {}

  findAllQuestions(): Promise<QuestionBase[]> {
    return this.prismaService.question
      .findMany({
        select: { name: true, source: true, difficulty: true, slug: true },
      })
      .then((questions) =>
        questions.map((question) => makeQuestionBase(question)),
      );
  }

  async findStats(userId: string): Promise<QuestionStats> {
    const progress = await this.findProgress(userId);
    const languageBreakdown = await this.findLanguageBreakdown(userId);
    // TODO: Replace difficulty breakdown with something else. Currently can't really
    // query this efficiently due to limitations with Prisma :(
    const difficultyBreakdown = { numEasy: 0, numMedium: 0, numHard: 0 };
    return { progress, difficultyBreakdown, languageBreakdown };
  }

  async createSubmission(
    dto: CreateSubmissionDto,
    userId: string,
  ): Promise<void> {
    dto.codeWritten = dto.codeWritten.trim();
    await this.prismaService.questionSubmission.create({
      data: { ...dto, userId },
    });
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
  ): Promise<void> {
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
    await this.prismaService.questionSubmission.update({
      where: { id },
      data: { ...dto },
    });
  }

  private async findProgress(userId: string): Promise<QuestionStatsProgress> {
    const ongoingWindow = await this.currentService.findOngoingWindow();
    if (ongoingWindow != null) {
      return this.findWindowProgress(userId, ongoingWindow);
    }
    return this.findWeekProgress(userId);
  }

  private async findWindowProgress(
    userId: string,
    window: Window,
  ): Promise<QuestionStatsProgress> {
    const studentResultWithSubmissionCount =
      await this.prismaService.studentResult.findFirst({
        where: {
          student: { userId, cohortId: window.cohortId },
          windowId: window.id,
        },
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
    const startOfWeek = findStartOfWeek();
    const endOfWeek = findEndOfWeek();
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
