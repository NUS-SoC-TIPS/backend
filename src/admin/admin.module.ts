import { Module } from '@nestjs/common';

import { RecordsModule } from '../records/records.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { WindowsModule } from '../windows/windows.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [WindowsModule, SubmissionsModule, RecordsModule],
})
export class AdminModule {}
