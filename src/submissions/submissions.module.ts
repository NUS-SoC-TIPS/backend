import { Module } from '@nestjs/common';

import { WindowsModule } from '../windows/windows.module';

import { SubmissionsQueryBuilder } from './builders';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsQueryBuilder],
  imports: [WindowsModule],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
