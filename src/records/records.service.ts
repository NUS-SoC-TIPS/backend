import { Injectable } from '@nestjs/common';
import { RoomRecord, Window } from '@prisma/client';

import { RecordWithPartner } from '../interfaces/interface';
import { PrismaService } from '../prisma/prisma.service';
import { WindowsService } from '../windows/windows.service';

import { RecordsQueryBuilder } from './builders';
import { CreateRecordDto } from './dtos';
import { RecordStatsEntity } from './entities';

@Injectable()
export class RecordsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly windowsService: WindowsService,
    private readonly queryBuilder: RecordsQueryBuilder,
  ) {}

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

  async findStats(userId: string): Promise<RecordStatsEntity> {
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    const before = ongoingWindow?.endAt;
    const after =
      ongoingWindow?.startAt ?? this.windowsService.findStartOfWeek();
    const numberOfRecordsForThisWindowOrWeek = await this.queryBuilder
      .reset()
      .forUser(userId)
      .createdBefore(before)
      .createdAfter(after)
      .count();
    const latestRecord = await this.queryBuilder
      .reset()
      .forUser(userId)
      .latest();
    const closestWindow = await this.windowsService.findClosestWindow();
    const allRecords = await this.queryBuilder
      .reset()
      .forUser(userId)
      .withLatestFirst()
      .query();
    return {
      closestWindow,
      numberOfRecordsForThisWindowOrWeek,
      latestRecord: latestRecord as RecordStatsEntity['latestRecord'],
      allRecords: allRecords as RecordStatsEntity['allRecords'],
    };
  }

  async findWithinWindow(
    userId: string,
    window: Window,
  ): Promise<RecordWithPartner[]> {
    const result = await this.queryBuilder
      .reset()
      .forUser(userId)
      .createdBefore(window.endAt)
      .createdAfter(window.startAt)
      .withLatestFirst()
      .query();
    return result as RecordWithPartner[];
  }
}
