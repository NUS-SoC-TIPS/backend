import { Module } from '@nestjs/common';

import { Judge0Module } from '../judge0/judge0.module';
import { UsersModule } from '../users/users.module';

import { CodeGateway } from './code.gateway';
import { CodeService } from './code.service';

@Module({
  providers: [CodeGateway, CodeService],
  exports: [CodeService],
  imports: [UsersModule, Judge0Module],
})
export class CodeModule {}
