import { Logger, Module } from '@nestjs/common';

import { ResultsModule } from '../../../productinfra/results/results.module';
import { WindowsModule } from '../../../windows/windows.module';

import { SubmissionsQueryBuilder } from './builders';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsQueryBuilder, Logger],
  imports: [ResultsModule, WindowsModule],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
