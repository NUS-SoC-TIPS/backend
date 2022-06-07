import { Module } from '@nestjs/common';

import { WindowsModule } from '../windows/windows.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [WindowsModule],
})
export class AdminModule {}
