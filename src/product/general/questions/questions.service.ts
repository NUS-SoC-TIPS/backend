import { Injectable, Logger } from '@nestjs/common';

import { Question } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
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
