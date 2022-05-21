import { Injectable } from '@nestjs/common';
import { Question } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly prismaService: PrismaService) {}

  findAll(): Promise<Question[]> {
    return this.prismaService.question.findMany();
  }
}
