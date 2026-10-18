import { Logger, Module } from '@nestjs/common';

import { WebrtcService } from './webrtc.service';

@Module({
  providers: [WebrtcService, Logger],
  exports: [WebrtcService],
})
export class WebrtcModule {}
