import { Logger, Module } from '@nestjs/common';

import { ExclusionsController } from './exclusions.controller';
import { ExclusionsService } from './exclusions.service';

@Module({
  controllers: [ExclusionsController],
  providers: [ExclusionsService, Logger],
})
export class ExclusionsModule {}
