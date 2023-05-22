import { Module } from '@nestjs/common';

import { CohortsModule } from './cohorts/cohorts.module';

@Module({
  imports: [CohortsModule],
})
export class StudentModule {}
