import { Injectable } from '@nestjs/common';
import { Question, QuestionSubmission, Window } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSubmissionDto } from './dtos/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(
    createSubmissionDto: CreateSubmissionDto,
    userId: string,
  ): Promise<QuestionSubmission> {
    return this.prismaService.questionSubmission.create({
      data: {
        ...createSubmissionDto,
        userId,
      },
    });
  }

  async findLatest(
    userId,
  ): Promise<(QuestionSubmission & { question: Question }) | null> {
    return (
      (await this.prismaService.questionSubmission.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          question: true,
        },
      })) || null
    );
  }

  findWithinWindow(
    userId: string,
    window: Window,
  ): Promise<
    (QuestionSubmission & {
      question: Question;
    })[]
  > {
    return this.prismaService.questionSubmission.findMany({
      where: {
        userId,
        createdAt: {
          gte: window.startAt,
          lte: window.endAt,
        },
      },
      include: {
        question: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
