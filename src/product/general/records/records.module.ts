import { Logger, Module } from '@nestjs/common';

import { WindowsModule } from '../../../windows/windows.module';

import { RecordsQueryBuilder } from './builders';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  providers: [RecordsService, RecordsQueryBuilder, Logger],
  controllers: [RecordsController],
  imports: [WindowsModule],
  exports: [RecordsService],
})
export class RecordsModule {}
