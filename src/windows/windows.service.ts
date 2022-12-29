import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Window } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WindowsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
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

  /**
   * Logic behind closest window:
   * - If currently in the middle of a window, that will be returned
   * - Else if there exists a window in the future, the upcoming window will be returned
   * - Else (all windows are over), the most recent window will be returned
   *
   * Currently, this fires off three separate transactions, which is safe since windows are only refreshed
   * on app restart.
   *
   * TODO: Consider whether there's a need to wrap these queries in a single transaction.
   */
  async findClosestWindow(): Promise<Window> {
    const ongoingWindow = await this.findOngoingWindow();
    if (ongoingWindow != null) {
      return ongoingWindow;
    }
    const upcomingWindow = await this.findUpcomingWindow();
    if (upcomingWindow != null) {
      return upcomingWindow;
    }
    const mostRecentPastWindow = await this.findMostRecentPastWindowOrThrow();
    return mostRecentPastWindow;
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

  findCurrentIterationWindows(): Promise<Window[]> {
    return this.prismaService.window
      .findMany({
        where: {
          iteration: Number(this.configService.get('CURRENT_ITERATION')),
        },
        orderBy: {
          startAt: 'asc',
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find windows for current iteration',
          e instanceof Error ? e.stack : undefined,
          WindowsService.name,
        );
        throw e;
      });
  }

  findStartOfWeek(): Date {
    const date = new Date();
    const day = date.getDay() || 7; // Get current day number, converting Sun. to 7
    if (day !== 1) {
      // Only manipulate the date if it isn't Mon.
      date.setHours(-24 * (day - 1));
    } // Set the hours to day number minus 1
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private findUpcomingWindow(): Promise<Window | null> {
    const currentDate = new Date();
    return this.prismaService.window
      .findFirst({
        where: {
          startAt: {
            gte: currentDate,
          },
        },
        orderBy: {
          startAt: 'asc',
        },
        take: 1,
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find nullable upcoming window',
          e instanceof Error ? e.stack : undefined,
          WindowsService.name,
        );
        throw e;
      });
  }

  private findMostRecentPastWindowOrThrow(): Promise<Window> {
    return this.prismaService.window
      .findFirstOrThrow({
        orderBy: {
          startAt: 'desc',
        },
        take: 1,
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find non-null most recent past window',
          e instanceof Error ? e.stack : undefined,
          WindowsService.name,
        );
        throw e;
      });
  }
}
