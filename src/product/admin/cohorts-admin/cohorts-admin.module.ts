import { Logger, Module } from '@nestjs/common';

import { CohortsAdminController } from './cohorts-admin.controller';
import { CohortsAdminService } from './cohorts-admin.service';

@Module({
  controllers: [CohortsAdminController],
  providers: [CohortsAdminService, Logger],
})
export class CohortsAdminModule {}
