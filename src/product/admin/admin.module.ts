import { Logger, Module } from '@nestjs/common';

import { WindowsModule } from '../../productinfra/windows/windows.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, Logger],
  imports: [WindowsModule],
})
export class AdminModule {}
