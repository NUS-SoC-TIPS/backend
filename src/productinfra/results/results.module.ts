import { Logger, Module } from '@nestjs/common';

import { WindowsModule } from '../windows/windows.module';

import { ResultsService } from './results.service';

@Module({
  providers: [ResultsService, Logger],
  imports: [WindowsModule],
  exports: [ResultsService],
})
export class ResultsModule {}
