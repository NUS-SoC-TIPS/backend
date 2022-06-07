import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Window } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WindowsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Logic behind closest window:
   * - If currently in the middle of a window, that will be returned
   * - Else if there exists a window in the future, the upcoming window will be returned
   * - Else (all windows are over), the most recent window will be returned
   */
  async findClosestWindow(): Promise<Window> {
    const ongoingWindow = await this.findOngoingWindow();
    if (ongoingWindow) {
      return ongoingWindow;
    }

    const currentDate = new Date();
    const upcomingWindow = await this.prismaService.window.findFirst({
      where: {
        startAt: {
          gte: currentDate,
        },
      },
      orderBy: {
        startAt: 'asc',
      },
      take: 1,
    });
    if (upcomingWindow) {
      return upcomingWindow;
    }

    // Most recent past window
    return this.prismaService.window.findFirst({
      orderBy: {
        startAt: 'desc',
      },
      take: 1,
    });
  }

  findOngoingWindow(): Promise<Window | null> {
    const currentDate = new Date();
    return this.prismaService.window.findFirst({
      where: {
        startAt: {
          lte: currentDate,
        },
        endAt: {
          gte: currentDate,
        },
      },
    });
  }

  findCurrentIterationWindows(): Promise<Window[]> {
    return this.prismaService.window.findMany({
      where: {
        iteration: Number(this.configService.get('CURRENT_ITERATION')),
      },
      orderBy: {
        startAt: 'asc',
      },
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
}
