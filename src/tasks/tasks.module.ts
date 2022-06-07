import { Module } from '@nestjs/common';

import { RecordsModule } from '../records/records.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { WindowsModule } from '../windows/windows.module';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  imports: [WindowsModule, SubmissionsModule, RecordsModule],
})
export class TasksModule {}
