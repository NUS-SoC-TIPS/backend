import { Module } from '@nestjs/common';

import { AgoraModule } from '../agora/agora.module';
import { CodeModule } from '../code/code.module';
import { Judge0Module } from '../judge0/judge0.module';
import { NotesModule } from '../notes/notes.module';
import { RecordsModule } from '../records/records.module';

import { RoomsController } from './rooms.controller';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  imports: [AgoraModule, CodeModule, NotesModule, RecordsModule, Judge0Module],
})
export class RoomsModule {}
