import { Injectable } from '@nestjs/common';

import { Question } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<Question[]> {
    return this.prismaService.question.findMany();
  }
}
