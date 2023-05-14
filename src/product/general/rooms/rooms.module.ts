import { Logger, Module } from '@nestjs/common';

import { AgoraModule } from '../../../productinfra/agora/agora.module';
import { ResultsModule } from '../../../productinfra/results/results.module';
import { CodeModule } from '../code/code.module';
import { NotesModule } from '../notes/notes.module';

import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, Logger],
  imports: [AgoraModule, CodeModule, NotesModule, ResultsModule],
})
export class RoomsModule {}
