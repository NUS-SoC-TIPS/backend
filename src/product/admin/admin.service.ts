import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { makeUserBase } from '../interfaces';

import { AdminOverview } from './admin.interfaces';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOverview(): Promise<AdminOverview> {
    const cohorts = await this.prismaService.cohort
      .findMany({
        include: {
          _count: { select: { students: true } },
          windows: { orderBy: { startAt: 'asc' } },
        },
      })
      .then((cohorts) =>
        cohorts.map((cohort) => {
          const startAt = cohort.windows[0].startAt;
          const endAt = cohort.windows[cohort.windows.length - 1].endAt;
          return {
            id: cohort.id,
            name: cohort.name,
            numStudents: cohort._count.students,
            startAt,
            endAt,
          };
        }),
      );
    const nonStudents = await this.prismaService.user
      .findMany({
        where: { students: { none: {} } },
        orderBy: { createdAt: 'desc' },
      })
      .then((nonStudents) =>
        nonStudents.map((nonStudent) => ({
          ...makeUserBase(nonStudent),
          joinedAt: nonStudent.createdAt,
        })),
      );
    return { cohorts, nonStudents };
  }
}
