import { Logger, Module } from '@nestjs/common';

import { CurrentModule } from '../../../productinfra/current/current.module';

import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

@Module({
  controllers: [InterviewsController],
  providers: [InterviewsService, Logger],
  imports: [CurrentModule],
})
export class InterviewsModule {}
