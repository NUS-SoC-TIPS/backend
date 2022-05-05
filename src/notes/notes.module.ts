import { Module } from '@nestjs/common';

import { NotesGateway } from './notes.gateway';
import { NotesService } from './notes.service';

@Module({
  providers: [NotesService, NotesGateway],
  exports: [NotesService],
})
export class NotesModule {}
