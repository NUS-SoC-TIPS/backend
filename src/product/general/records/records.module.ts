import { Logger, Module } from '@nestjs/common';

import { ResultsModule } from '../../../productinfra/results/results.module';

import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';

@Module({
  providers: [RecordsService, Logger],
  controllers: [RecordsController],
  imports: [ResultsModule],
  exports: [RecordsService],
})
export class RecordsModule {}
