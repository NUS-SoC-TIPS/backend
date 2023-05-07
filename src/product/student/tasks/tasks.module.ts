import { Logger, Module } from '@nestjs/common';

import { WindowsModule } from '../../../windows/windows.module';
import { RecordsModule } from '../../general/records/records.module';
import { SubmissionsModule } from '../../general/submissions/submissions.module';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, Logger],
  imports: [WindowsModule, SubmissionsModule, RecordsModule],
})
export class TasksModule {}
