import { Module } from '@nestjs/common';

import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  providers: [RecordsService],
  exports: [RecordsService],
  controllers: [RecordsController],
})
export class RecordsModule {}
