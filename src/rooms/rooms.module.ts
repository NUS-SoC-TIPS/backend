import { Module } from '@nestjs/common';

import { AgoraModule } from '../agora/agora.module';
import { CodeModule } from '../code/code.module';
import { NotesModule } from '../notes/notes.module';

import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  imports: [AgoraModule, CodeModule, NotesModule],
})
export class RoomsModule {}
