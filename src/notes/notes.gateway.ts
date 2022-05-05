import { UseGuards, ValidationPipe } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { GetUserWs } from 'src/auth/decorators';
import { AuthWsGuard } from 'src/auth/guards';
import { GetRoom } from 'src/rooms/decorators';
import { InRoomGuard } from 'src/rooms/guards';

import { NOTES_EVENTS } from './notes.constants';
import { NotesService } from './notes.service';

@WebSocketGateway()
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
