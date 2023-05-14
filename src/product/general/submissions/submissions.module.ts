import { Logger, Module } from '@nestjs/common';

import { ResultsModule } from '../../../productinfra/results/results.module';

import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, Logger],
  imports: [ResultsModule],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
