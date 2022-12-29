import { Logger, Module } from '@nestjs/common';

import { Judge0Service } from './judge0.service';

@Module({
  providers: [Judge0Service, Logger],
  exports: [Judge0Service],
})
export class Judge0Module {}
