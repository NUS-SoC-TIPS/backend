import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';

import { CodeGateway } from './code.gateway';
import { CodeService } from './code.service';

@Module({
  providers: [CodeGateway, CodeService],
  exports: [CodeService],
  imports: [UsersModule],
})
export class CodeModule {}
