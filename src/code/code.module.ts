import { Module } from '@nestjs/common';

import { CodeGateway } from './code.gateway';
import { CodeService } from './code.service';

@Module({
  providers: [CodeGateway, CodeService],
  exports: [CodeService],
})
export class CodeModule {}
