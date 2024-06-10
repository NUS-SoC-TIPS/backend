import { Injectable } from '@nestjs/common';

import { ExcuseStatus, User } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  ExcuseBase,
  makeExcuseBase,
} from '../../../product/interfaces/excuses';

import { CreateExcuseDto } from './dtos/create-excuse.dto';
import { UpdateExcuseDto } from './dtos/update-excuse.dto';

@Injectable()
export class ExcusesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllExcuses(cohortId: number): Promise<ExcuseBase[]> {
    const excuses = await this.prismaService.excuse.findMany({
      where: { window: { cohortId } },
      include: { student: { include: { user: true } }, window: true },
    });

    return excuses.map((excuse) => makeExcuseBase(excuse));
  }

  async findExcuse(id: number): Promise<ExcuseBase> {
    const excuse = await this.prismaService.excuse.findUniqueOrThrow({
      where: { id },
      include: { student: { include: { user: true } }, window: true },
    });

    return makeExcuseBase(excuse);
  }

  async findSelf(user: User, windowId?: number): Promise<ExcuseBase[]> {
    const student = await this.prismaService.student.findFirst({
      where: { userId: user.id },
    });

    if (!student) {
      return [];
    }

    const excuses = await this.prismaService.excuse.findMany({
      where: { studentId: student.id, windowId },
      include: { student: { include: { user: true } }, window: true },
    });

    return excuses.map((excuse) => makeExcuseBase(excuse));
  }

  async createExcuse(excuse: CreateExcuseDto, user: User): Promise<number> {
    const [student, window] = await Promise.all([
      this.prismaService.student.findFirst({
        where: { userId: user.id },
      }),
      this.prismaService.window.findUnique({
        where: { id: excuse.windowId },
      }),
    ]);

    if (!student || !window) {
      throw new Error('Student or Window not found');
    }

    if (window.endAt < new Date()) {
      throw new Error('End date must be greater than current date');
    }

    const createExcuseData = {
      ...excuse,
      studentId: student.id,
      status: ExcuseStatus.PENDING,
    };

    const createdExcuse = await this.prismaService.excuse.create({
      data: createExcuseData,
    });

    return createdExcuse.id;
  }

  async deleteExcuse(id: number): Promise<void> {
    await this.prismaService.excuse.delete({ where: { id } });
  }

  async updateExcuse(
    id: number,
    excuse: Partial<UpdateExcuseDto>,
  ): Promise<number> {
    const existingExcuse = await this.prismaService.excuse.findUnique({
      where: { id },
    });

    if (!existingExcuse) {
      throw new Error('Excuse not found');
    }

    const window = await this.prismaService.window.findUnique({
      where: { id: existingExcuse.windowId },
    });

    if (window && window.endAt < new Date()) {
      throw new Error('End date must be greater than current date');
    }

    const res = await this.prismaService.excuse.update({
      where: { id },
      data: { ...excuse },
    });

    return res.id;
  }
}
