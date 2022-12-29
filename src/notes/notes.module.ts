import { Logger, Module } from '@nestjs/common';

import { NotesGateway } from './notes.gateway';
import { NotesService } from './notes.service';

@Module({
  providers: [NotesService, NotesGateway, Logger],
  exports: [NotesService],
})
export class NotesModule {}
