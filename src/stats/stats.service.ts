import { Injectable } from '@nestjs/common';
import { Window } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prismaService: PrismaService) {}

  findNumCompletedAllTime(userId: string): Promise<number> {
    return this.prismaService.questionSubmission.count({
      where: {
        userId,
      },
    });
  }

  findNumCompletedThisWindow(
    userId: string,
    closestWindow: Window,
  ): Promise<number> {
    const currentDate = new Date();
    if (
      closestWindow.startAt <= currentDate &&
      closestWindow.endAt >= currentDate
    ) {
      // We're in the middle of a window, so we count using the window
      return this.prismaService.questionSubmission.count({
        where: {
          userId,
          createdAt: {
            gte: closestWindow.startAt,
            lte: closestWindow.endAt,
          },
        },
      });
    }

    // Else we count the current week's submissions
    return this.prismaService.questionSubmission.count({
      where: {
        userId,
        createdAt: {
          gte: this.getMonday(),
        },
      },
    });
  }

  // Logic behind closest window:
  // - If currently in the middle of a window, that will be returned
  // - Else if there exists a window in the future, the upcoming window will be returned
  // - Else (all windows are over), the most recent window will be returned
  async findClosestWindow(): Promise<Window> {
    const currentDate = new Date();
    const ongoingWindow = await this.prismaService.window.findFirst({
      where: {
        startAt: {
          lte: currentDate,
        },
        endAt: {
          gte: currentDate,
        },
      },
    });
    if (ongoingWindow) {
      return ongoingWindow;
    }

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

    return this.prismaService.window.findFirst({
      orderBy: {
        startAt: 'desc',
      },
      take: 1,
    });
  }

  // We won't handle much of timezones here. If it's slightly off, so be it.
  private getMonday(): Date {
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
