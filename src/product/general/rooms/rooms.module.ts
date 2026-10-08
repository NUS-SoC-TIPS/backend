import { Logger, Module } from '@nestjs/common';

import { CurrentModule } from '../../../productinfra/current/current.module';
import { WebrtcModule } from '../../../productinfra/webrtc/webrtc.module';
import { CodeModule } from '../code/code.module';
import { NotesModule } from '../notes/notes.module';

import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  providers: [RoomsService, RoomsGateway, Logger],
  imports: [WebrtcModule, CodeModule, NotesModule, CurrentModule],
})
export class RoomsModule {}
