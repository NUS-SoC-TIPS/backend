import { Injectable } from '@nestjs/common';
import { RoomRecord, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRecordDto } from './dtos';

@Injectable()
export class RecordsService {
  constructor(private prismaService: PrismaService) {}

  create(dto: CreateRecordDto): Promise<RoomRecord> {
    const { users, ...recordData } = dto;
    return this.prismaService.roomRecord.create({
      data: {
        ...recordData,
        users: {
          createMany: {
            data: users,
          },
        },
      },
    });
  }

  async findPage(
    page: number,
    userId: string,
  ): Promise<{
    records: (RoomRecord & { partner: User | null })[];
    isLastPage: boolean;
  }> {
    const records = await this.prismaService.roomRecord.findMany({
      where: {
        users: {
          some: {
            userId,
            isInterviewer: false,
          },
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: page * 3,
      take: 3,
    });
    const totalNumRecords = await this.prismaService.roomRecord.count({
      where: {
        users: {
          some: {
            userId,
            isInterviewer: false,
          },
        },
      },
    });
    const numSkippedRecords = page * 3;

    return {
      records: records.map((r) => ({
        ...r,
        partner: r.users.filter((u) => u.userId !== userId)?.[0].user ?? null,
      })),
      isLastPage: numSkippedRecords + records.length >= totalNumRecords,
    };
  }
}
