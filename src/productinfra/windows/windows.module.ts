import { Logger, Module } from '@nestjs/common';

import { WindowsService } from './windows.service';

@Module({
  providers: [WindowsService, Logger],
  exports: [WindowsService],
})
export class WindowsModule {}
