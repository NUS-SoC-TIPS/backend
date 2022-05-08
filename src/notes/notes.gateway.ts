import { UseGuards, ValidationPipe } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { GetUserWs } from '../auth/decorators';
import { AuthWsGuard } from '../auth/guards';
import { GetRoom } from '../rooms/decorators';
import { InRoomGuard } from '../rooms/guards';

import { NOTES_EVENTS } from './notes.constants';
import { NotesService } from './notes.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotesGateway {
  constructor(private notesService: NotesService) {}

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(NOTES_EVENTS.UPDATE_NOTES)
  handleMessage(
    @MessageBody(new ValidationPipe()) notes: string,
    @GetRoom('id') roomId: number,
    @GetUserWs('id') userId: string,
  ): void {
    this.notesService.updateNotes(roomId, userId, notes);
  }
}
