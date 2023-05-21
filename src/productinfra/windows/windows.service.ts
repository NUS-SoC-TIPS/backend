import { Injectable } from '@nestjs/common';

import { Window } from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class WindowsService {
  constructor(private readonly prismaService: PrismaService) {}

  findOrThrow(windowId: number): Promise<Window> {
    return this.prismaService.window.findUniqueOrThrow({
      where: { id: windowId },
    });
  }

  findOngoingWindow(): Promise<Window | null> {
    const currentDate = new Date();
    return this.prismaService.window.findFirst({
      where: { startAt: { lte: currentDate }, endAt: { gte: currentDate } },
    });
  }
}
