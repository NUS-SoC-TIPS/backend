import { UseGuards, ValidationPipe } from '@nestjs/common';
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
import { UpdateCodeDto } from './dtos';

@WebSocketGateway()
export class CodeGateway {
  constructor(private codeService: CodeService) {}

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_CODE)
  updateCode(
    @MessageBody(new ValidationPipe()) data: UpdateCodeDto,
    @ConnectedSocket() socket: ISocket,
    @GetRoom() room: Room,
  ): void {
    this.codeService.updateCode(room, data.code);
    socket.to(`${room.id}`).emit(CODE_EVENTS.UPDATE_CODE, data);
  }
}
