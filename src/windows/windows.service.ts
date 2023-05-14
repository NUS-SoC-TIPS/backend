import { Injectable, Logger } from '@nestjs/common';

import { Window } from '../infra/prisma/generated';
import { PrismaService } from '../infra/prisma/prisma.service';

@Injectable()
export class WindowsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  findOrThrow(windowId: number): Promise<Window> {
    return this.prismaService.window
      .findUniqueOrThrow({ where: { id: windowId } })
      .catch((e) => {
        this.logger.error(
          `Failed to find window with ID: ${windowId}`,
          e instanceof Error ? e.stack : undefined,
          WindowsService.name,
        );
        throw e;
      });
  }

  findCurrentCohortWindows(): Promise<Window[]> {
    return this.prismaService.window
      .findMany({
        where: {
          // TODO: Replace the hardcoded cohort ID with a variable one
          cohortId: 1,
        },
        orderBy: {
          startAt: 'asc',
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find windows for current cohort',
          e instanceof Error ? e.stack : undefined,
          WindowsService.name,
        );
        throw e;
      });
  }
}
