import { Logger, Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { WindowsModule } from '../windows/windows.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, Logger],
  imports: [WindowsModule, UsersModule],
})
export class AdminModule {}
