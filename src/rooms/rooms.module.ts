import { Module } from '@nestjs/common';

import { AgoraModule } from '../agora/agora.module';

import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  imports: [AgoraModule],
})
export class RoomsModule {}
