import { Logger, Module } from '@nestjs/common';

import { CohortsAdminModule } from './cohorts-admin/cohorts-admin.module';
import { ExclusionsModule } from './exclusions/exclusions.module';
import { WindowsModule } from './windows/windows.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, Logger],
  imports: [WindowsModule, ExclusionsModule, CohortsAdminModule],
})
export class AdminModule {}
