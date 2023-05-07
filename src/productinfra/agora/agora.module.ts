import { Logger, Module } from '@nestjs/common';

import { AgoraService } from './agora.service';

@Module({
  providers: [AgoraService, Logger],
  exports: [AgoraService],
})
export class AgoraModule {}
