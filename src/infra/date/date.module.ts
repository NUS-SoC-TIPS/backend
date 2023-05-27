import { Global, Logger, Module } from '@nestjs/common';

import { DateService } from './date.service';

@Global()
@Module({
  providers: [DateService, Logger],
  exports: [DateService],
})
export class DateModule {}
