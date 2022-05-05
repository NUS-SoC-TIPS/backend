import { Module } from '@nestjs/common';

import { RoomsDataStructure } from './data-structures/rooms.data-structure';
import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, RoomsDataStructure],
})
export class RoomsModule {}
