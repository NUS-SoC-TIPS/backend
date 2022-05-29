import { Injectable } from '@nestjs/common';
import { RoomRecord, User, Window } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRecordDto } from './dtos';

@Injectable()
export class RecordsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(dto: CreateRecordDto): Promise<RoomRecord> {
    const { roomRecordUsers, ...recordData } = dto;
    return this.prismaService.roomRecord.create({
      data: {
        ...recordData,
        roomRecordUsers: {
          createMany: {
            data: roomRecordUsers,
          },
        },
      },
    });
  }

  /**
   * Finds valid interviews within this window. Validity is defined as:
   * - There is a partner in the room.
   * - The interview lasted for at least 15 minutes.
   *
   * @param userId User to find records for.
   * @param window Window to find records for.
   * @returns The record together with the partner user.
   */
  findValidWithinWindow(
    userId: string,
    window: Window,
  ): Promise<
    (RoomRecord & {
      partner: User;
    })[]
  > {
    return this.prismaService.roomRecord
      .findMany({
        where: {
          roomRecordUsers: {
            some: {
              userId,
              // Querying for false handles both general and roleplay interviews
              isInterviewer: false,
            },
          },
          createdAt: {
            gte: window.startAt,
            lte: window.endAt,
          },
          duration: {
            gte: 900000, // 15 minutes in milliseconds
          },
        },
        include: {
          roomRecordUsers: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
      .then((interviews) =>
        interviews
          .filter((i) => i.roomRecordUsers.length === 2)
          .map((i) => {
            const { roomRecordUsers, ...record } = i;
            return {
              ...record,
              partner: roomRecordUsers.filter((u) => u.user.id !== userId)[0]
                .user,
            };
          }),
      );
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
        roomRecordUsers: {
          some: {
            userId,
            isInterviewer: false,
          },
        },
      },
      include: {
        roomRecordUsers: {
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
        roomRecordUsers: {
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
        partner:
          r.roomRecordUsers.filter((u) => u.userId !== userId)?.[0].user ??
          null,
      })),
      isLastPage: numSkippedRecords + records.length >= totalNumRecords,
    };
  }
}
