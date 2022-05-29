import { Module } from '@nestjs/common';

import { RecordsModule } from '../records/records.module';
import { SubmissionsModule } from '../submissions/submissions.module';

import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  controllers: [StatsController],
  providers: [StatsService],
  imports: [SubmissionsModule, RecordsModule],
})
export class StatsModule {}
