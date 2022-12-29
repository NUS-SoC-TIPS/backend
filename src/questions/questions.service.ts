import { Injectable, Logger } from '@nestjs/common';
import { Question } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  findAll(): Promise<Question[]> {
    return this.prismaService.question.findMany().catch((e) => {
      this.logger.error(
        'Failed to find all questions',
        e instanceof Error ? e.stack : undefined,
        QuestionsService.name,
      );
      throw e;
    });
  }
}
