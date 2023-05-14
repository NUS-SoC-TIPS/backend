import { Logger, Module } from '@nestjs/common';

import { ResultsService } from './results.service';

@Module({
  providers: [ResultsService, Logger],
  exports: [ResultsService],
})
export class ResultsModule {}
