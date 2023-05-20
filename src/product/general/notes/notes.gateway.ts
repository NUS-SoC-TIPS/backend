import { Logger, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { GetUserWs } from '../../../productinfra/decorators';
import { AuthWsGuard } from '../../../productinfra/guards';
import { GetRoom } from '../rooms/decorators';
import { InRoomGuard } from '../rooms/guards';

import { NOTES_EVENTS } from './notes.constants';
import { NotesService } from './notes.service';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
  },
})
export class NotesGateway {
  constructor(
    private readonly logger: Logger,
    private readonly notesService: NotesService,
  ) {}

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(NOTES_EVENTS.UPDATE_NOTES)
  handleMessage(
    @MessageBody(new ValidationPipe()) notes: string,
    @GetRoom('id') roomId: number,
    @GetUserWs('id') userId: string,
  ): void {
    this.logger.log(NOTES_EVENTS.UPDATE_NOTES, NotesGateway.name);
    this.notesService.updateNotes(roomId, userId, notes);
  }
}
