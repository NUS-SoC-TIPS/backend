import { Logger, Module } from '@nestjs/common';

import { WindowsModule } from '../../windows/windows.module';
import { UsersModule } from '../general/users/users.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, Logger],
  imports: [WindowsModule, UsersModule],
})
export class AdminModule {}
