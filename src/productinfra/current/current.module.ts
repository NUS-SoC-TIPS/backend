import { Logger, Module } from '@nestjs/common';

import { CurrentService } from './current.service';

// A module that contains a helper service, which helps with
// operations based on the time currently, e.g. finding ongoing
// windows, ongoing cohorts, matching new submissions/records.
@Module({
  providers: [CurrentService, Logger],
  exports: [CurrentService],
})
export class CurrentModule {}
