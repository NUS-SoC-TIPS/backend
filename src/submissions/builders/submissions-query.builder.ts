import { Injectable } from '@nestjs/common';

import { SubmissionWithQuestion } from '../../interfaces/interface';
import { PrismaService } from '../../prisma/prisma.service';

interface Where {
  where?: {
    userId?: string;
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
  };
}

interface OrderBy {
  orderBy?: {
    createdAt: 'desc';
  };
}

interface Include {
  include: {
    question: true;
  };
}

@Injectable()
export class SubmissionsQueryBuilder {
  private userId: string | null = null;
  private before: Date | null = null;
  private after: Date | null = null;
  private latestFirst = false;

  constructor(private readonly prismaService: PrismaService) {}

  reset(): this {
    this.userId = this.before = this.after = null;
    this.latestFirst = false;
    return this;
  }

  forUser(userId: string): this {
    this.userId = userId;
    return this;
  }

  createdBefore(before: Date | undefined): this {
    this.before = before ?? null;
    return this;
  }

  createdAfter(after: Date | undefined): this {
    this.after = after ?? null;
    return this;
  }

  withLatestFirst(): this {
    this.latestFirst = true;
    return this;
  }

  count(): Promise<number> {
    return this.prismaService.questionSubmission.count({ ...this.getWhere() });
  }

  latest(): Promise<SubmissionWithQuestion | null> {
    return this.prismaService.questionSubmission.findFirst({
      ...this.getWhere(),
      ...this.getInclude(),
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });
  }

  query(): Promise<SubmissionWithQuestion[]> {
    return this.prismaService.questionSubmission.findMany({
      ...this.getWhere(),
      ...this.getOrderBy(),
      ...this.getInclude(),
    });
  }

  private getWhere(): Where {
    if (!this.userId && !this.before && !this.after) {
      return {};
    }
    return {
      where: {
        ...(this.userId ? { userId: this.userId } : {}),
        ...(this.before || this.after
          ? {
              createdAt: {
                ...(this.after ? { gte: this.after } : {}),
                ...(this.before ? { lte: this.before } : {}),
              },
            }
          : {}),
      },
    };
  }

  private getOrderBy(): OrderBy {
    return this.latestFirst ? { orderBy: { createdAt: 'desc' } } : {};
  }

  private getInclude(): Include {
    return { include: { question: true } };
  }
}
