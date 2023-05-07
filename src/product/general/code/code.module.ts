import { Logger, Module } from '@nestjs/common';

import { Judge0Module } from '../../../productinfra/judge0/judge0.module';
import { UsersModule } from '../users/users.module';

import { CodeController } from './code.controller';
import { CodeGateway } from './code.gateway';
import { CodeService } from './code.service';

@Module({
  controllers: [CodeController],
  providers: [CodeGateway, CodeService, Logger],
  exports: [CodeService],
  imports: [UsersModule, Judge0Module],
})
export class CodeModule {}
