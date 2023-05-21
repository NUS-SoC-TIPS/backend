import { Logger, Module } from '@nestjs/common';

import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

@Module({
  controllers: [InterviewsController],
  providers: [InterviewsService, Logger],
})
export class RoomsModule {}
