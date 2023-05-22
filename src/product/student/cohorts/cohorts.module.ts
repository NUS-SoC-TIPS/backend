import { Logger, Module } from '@nestjs/common';

import { CohortsController } from './cohorts.controller';
import { CohortsService } from './cohorts.service';

@Module({
  providers: [CohortsService, Logger],
  controllers: [CohortsController],
})
export class CohortsModule {}
