import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../infra/prisma/prisma.service';

import { CreateExclusionDto } from './dtos';

@Injectable()
export class ExclusionsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  async createExclusion(dto: CreateExclusionDto): Promise<void> {
    const window = await this.prismaService.window.findUniqueOrThrow({
      where: { id: dto.windowId },
    });
    const student = await this.prismaService.student.findUniqueOrThrow({
      where: { id: dto.studentId },
      include: { exclusion: { include: { window: true } } },
    });
    const existingExclusion = student.exclusion;
    if (
      existingExclusion &&
      existingExclusion.window.startAt <= window.startAt
    ) {
      this.logger.log(
        "User's existing exclusion is earlier than the one being created",
        ExclusionsService.name,
      );
      return;
    }

    dto.reason = dto.reason.trim();

    await this.prismaService.$transaction(async (tx) => {
      if (existingExclusion) {
        // Update if we're going for an earlier exclusion than the existing one for
        // the same cohort.
        await tx.exclusion.update({
          data: { windowId: dto.windowId, reason: dto.reason },
          where: { id: existingExclusion.id },
        });
      } else {
        await tx.exclusionNotification.create({
          data: {
            notification: { create: { userId: student.userId } },
            exclusion: { create: { ...dto } },
          },
        });
      }
      // We'll now unpair this student for all future windows, including
      // the current one that we're excluding for.
      await tx.pairing.deleteMany({
        where: {
          pairingStudents: { some: { studentId: student.id } },
          window: { startAt: { gte: window.startAt } },
        },
      });
    });
  }

  async removeExclusion(exclusionId: number): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      await tx.notification.deleteMany({
        where: { exclusionNotification: { exclusionId } },
      });
      await tx.exclusion.delete({ where: { id: exclusionId } });
    });
  }
}
