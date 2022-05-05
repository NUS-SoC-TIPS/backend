import { ParseArrayPipe, ParseEnumPipe, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Language, Room } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Server } from 'socket.io';

import { AuthWsGuard } from '../auth/guards';
import { ISocket } from '../interfaces/socket';
import { GetRoom } from '../rooms/decorators';
import { InRoomGuard } from '../rooms/guards';

import { CODE_EVENTS } from './code.constants';
import { CodeService } from './code.service';

@WebSocketGateway()
export class CodeGateway {
  @WebSocketServer()
  server: Server;
  constructor(private codeService: CodeService) {}

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_CODE)
  updateCode(
    @MessageBody(new ParseArrayPipe({ items: String })) code: string[],
    @ConnectedSocket() socket: ISocket,
    @GetRoom() room: Room,
  ): void {
    this.codeService.updateCode(room, code);
    socket.to(`${room.id}`).emit(CODE_EVENTS.UPDATE_CODE, code);
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_LANGUAGE)
  updateLanguage(
    @MessageBody(new ParseEnumPipe(Language))
    language: Language,
    @GetRoom() room: Room,
  ): void {
    this.codeService.updateLanguage(room, language);
    this.server.to(`${room.id}`).emit(CODE_EVENTS.UPDATE_LANGUAGE, language);
  }
}
