import { Module } from '@nestjs/common';

import { AgoraService } from './agora.service';

@Module({
  providers: [AgoraService],
  exports: [AgoraService],
})
export class AgoraModule {}
