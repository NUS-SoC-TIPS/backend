import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Room } from '@prisma/client';

import { AuthWsGuard } from '../auth/guards';
import { ISocket } from '../interfaces/socket';
import { GetRoom } from '../rooms/decorators';
import { InRoomGuard } from '../rooms/guards';

import { CODE_EVENTS } from './code.constants';
import { CodeService } from './code.service';

@WebSocketGateway()
export class CodeGateway {
  constructor(private codeService: CodeService) {}

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_CODE)
  handleMessage(
    @MessageBody() code: string[],
    @ConnectedSocket() socket: ISocket,
    @GetRoom() room: Room,
  ): void {
    this.codeService.updateCode(room, code);
    socket.to(`${room.id}`).emit(CODE_EVENTS.UPDATE_CODE, code);
  }
}
