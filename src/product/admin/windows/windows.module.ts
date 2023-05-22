import { Logger, Module } from '@nestjs/common';

import { WindowsController } from './windows.controller';
import { WindowsService } from './windows.service';

@Module({
  controllers: [WindowsController],
  providers: [WindowsService, Logger],
})
export class WindowsModule {}
