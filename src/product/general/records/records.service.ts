import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ResultsService } from '../../../productinfra/results/results.service';
import { findStartOfWeek, transformRoomRecord } from '../../../utils';

import { RecordStatsEntity } from './entities';

@Injectable()
export class RecordsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly resultsService: ResultsService,
  ) {}

  async findStats(userId: string): Promise<RecordStatsEntity> {
    const [numberOfRecordsForThisWindowOrWeek, isWindow] =
      await this.countRecordsForThisWindowOrWeek(userId);
    const allRecords = await this.prismaService.roomRecord
      .findMany({
        where: { roomRecordUsers: { some: { userId } }, isValid: true },
        orderBy: { createdAt: 'desc' },
        include: { roomRecordUsers: { include: { user: true } } },
      })
      .then((roomRecords) =>
        roomRecords.map((roomRecord) =>
          transformRoomRecord(roomRecord, userId),
        ),
      )
      .catch((e) => {
        this.logger.error(
          'Failed to find all room records',
          e instanceof Error ? e.stack : undefined,
          RecordsService.name,
        );
        throw e;
      });
    const latestRecord = allRecords.length > 0 ? allRecords[0] : null;
    const averageInterviewDurationMs =
      allRecords.reduce((acc, curr) => acc + curr.duration, 0) /
      allRecords.length;
    return {
      numberOfRecordsForThisWindowOrWeek,
      isWindow,
      latestRecord: latestRecord,
      averageInterviewDurationMs,
      allRecords: allRecords,
    };
  }

  private async countRecordsForThisWindowOrWeek(
    userId: string,
  ): Promise<[number, boolean]> {
    const studentRecord =
      await this.resultsService.findStudentResultForOngoingWindow(userId);
    if (studentRecord != null) {
      return [studentRecord._count.roomRecordUsers, true];
    }
    return [
      await this.prismaService.roomRecord
        .count({
          where: {
            roomRecordUsers: { some: { userId } },
            isValid: true,
            createdAt: { gte: findStartOfWeek() },
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to count number of records for this week',
            e instanceof Error ? e.stack : undefined,
            RecordsService.name,
          );
          throw e;
        }),
      false,
    ];
  }
}
