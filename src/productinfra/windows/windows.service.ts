import { Injectable, Logger } from '@nestjs/common';

import { Window } from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';

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

  findOngoingWindow(): Promise<Window | null> {
    const currentDate = new Date();
    return this.prismaService.window
      .findFirst({
        where: {
          startAt: {
            lte: currentDate,
          },
          endAt: {
            gte: currentDate,
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find nullable ongoing window',
          e instanceof Error ? e.stack : undefined,
          WindowsService.name,
        );
        throw e;
      });
  }
}