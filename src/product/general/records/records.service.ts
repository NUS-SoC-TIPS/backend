import { Injectable, Logger } from '@nestjs/common';

import { findStartOfWeek } from '../../../utils';
import { WindowsService } from '../../../windows/windows.service';

import { RecordsQueryBuilder } from './builders';
import { RecordStatsEntity } from './entities';

@Injectable()
export class RecordsService {
  constructor(
    private readonly logger: Logger,
    private readonly windowsService: WindowsService,
    private readonly queryBuilder: RecordsQueryBuilder,
  ) {}

  async findStats(userId: string): Promise<RecordStatsEntity> {
    // Finding window may throw. We will not catch here and instead let the
    // controller handle it.
    const ongoingWindow = await this.windowsService.findOngoingWindow();
    const before = ongoingWindow?.endAt;
    const after = ongoingWindow?.startAt ?? findStartOfWeek();
    const numberOfRecordsForThisWindowOrWeek = await this.queryBuilder
      .reset()
      .forUser(userId)
      .createdBefore(before)
      .createdAfter(after)
      .count()
      .catch((e) => {
        this.logger.error(
          'Failed to count room records for this window or week',
          e instanceof Error ? e.stack : undefined,
          RecordsService.name,
        );
        throw e;
      });
    const latestRecord = await this.queryBuilder
      .reset()
      .forUser(userId)
      .latest()
      .catch((e) => {
        this.logger.error(
          'Failed to find latest room record',
          e instanceof Error ? e.stack : undefined,
          RecordsService.name,
        );
        throw e;
      });
    const closestWindow = await this.windowsService.findClosestWindow();
    const allRecords = await this.queryBuilder
      .reset()
      .forUser(userId)
      .withLatestFirst()
      .query()
      .catch((e) => {
        this.logger.error(
          'Failed to find all room records',
          e instanceof Error ? e.stack : undefined,
          RecordsService.name,
        );
        throw e;
      });
    return {
      closestWindow,
      numberOfRecordsForThisWindowOrWeek,
      latestRecord: latestRecord as RecordStatsEntity['latestRecord'],
      allRecords: allRecords as RecordStatsEntity['allRecords'],
    };
  }
}
