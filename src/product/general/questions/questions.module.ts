import { Logger, Module } from '@nestjs/common';

import { CurrentModule } from '../../../productinfra/current/current.module';

import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, Logger],
  imports: [CurrentModule],
})
export class QuestionsModule {}
