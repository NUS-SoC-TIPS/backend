import { Logger, Module } from '@nestjs/common';

import { ExcusesController } from './excuses.controller';
import { ExcusesService } from './excuses.service';

@Module({
  controllers: [ExcusesController],
  providers: [ExcusesService, Logger],
})
export class ExcusesModule {}
