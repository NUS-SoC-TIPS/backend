import { Module } from '@nestjs/common';

import { WindowsService } from './windows.service';

@Module({
  providers: [WindowsService],
  exports: [WindowsService],
})
export class WindowsModule {}
