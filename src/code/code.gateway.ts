import {
  ParseArrayPipe,
  ParseEnumPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Language } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Server } from 'socket.io';

import { AuthWsGuard } from '../auth/guards';
import { ISocket } from '../interfaces/socket';
import { GetRoom } from '../rooms/decorators';
import { InRoomGuard } from '../rooms/guards';

import { CursorDto } from './dtos/cursor.dto';
import { CODE_EVENTS } from './code.constants';
import { CodeService } from './code.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CodeGateway {
  @WebSocketServer()
  server: Server;
  constructor(private codeService: CodeService) {}

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_CODE)
  updateCode(
    @MessageBody(new ParseArrayPipe({ items: String })) code: string[],
    @ConnectedSocket() socket: ISocket,
    @GetRoom('id') roomId: number,
  ): void {
    this.codeService.updateCode(roomId, code);
    socket.broadcast.to(`${roomId}`).emit(CODE_EVENTS.UPDATE_CODE, code);
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_LANGUAGE)
  updateLanguage(
    @MessageBody(new ParseEnumPipe(Language))
    language: Language,
    @GetRoom('id') roomId: number,
    @ConnectedSocket() socket: ISocket,
  ): void {
    this.codeService.updateLanguage(roomId, language);
    socket.broadcast
      .to(`${roomId}`)
      .emit(CODE_EVENTS.UPDATE_LANGUAGE, language);
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_CURSOR)
  updateCursor(
    @MessageBody(new ValidationPipe()) cursor: CursorDto,
    @ConnectedSocket() socket: ISocket,
    @GetRoom('id') roomId: number,
  ): void {
    socket.broadcast.to(`${roomId}`).emit(CODE_EVENTS.UPDATE_CURSOR, cursor);
  }
}
