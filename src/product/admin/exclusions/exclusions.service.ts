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
    if (!student) {
      throw new Error('Student does not exist');
    }

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

    if (existingExclusion) {
      // Update if we're going for an earlier exclusion than the existing one for
      // the same cohort.
      await this.prismaService.exclusion.update({
        data: { windowId: dto.windowId, reason: dto.reason },
        where: { id: existingExclusion.id },
      });
      return;
    }
    await this.prismaService.exclusion.create({ data: { ...dto } });
  }

  async removeExclusion(exclusionId: number): Promise<void> {
    await this.prismaService.exclusion.delete({ where: { id: exclusionId } });
  }
}
