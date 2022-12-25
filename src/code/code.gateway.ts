import { OnModuleDestroy, ParseEnumPipe, UseGuards } from '@nestjs/common';
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

import {
  CODE_EVENTS,
  CODE_EXECUTION_AUTO_CANCEL_DURATION,
} from './code.constants';
import { CodeService } from './code.service';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
  },
})
export class CodeGateway implements OnModuleDestroy {
  @WebSocketServer()
  server: Server;
  private roomIdToCodeExecutionTimeouts: Map<number, NodeJS.Timeout>;

  constructor(private readonly codeService: CodeService) {
    this.roomIdToCodeExecutionTimeouts = new Map();
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.CONNECT_YJS)
  connectYjs(@ConnectedSocket() socket: ISocket, @GetRoom() room: Room): void {
    socket.emit(CODE_EVENTS.CONNECT_YJS);
    const { sync, awareness } = this.codeService.joinOrInitDoc(room, socket);
    socket.emit(CODE_EVENTS.UPDATE_YJS, sync);
    if (awareness) {
      socket.emit(CODE_EVENTS.UPDATE_YJS, awareness);
    }
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.UPDATE_YJS)
  updateYjs(
    @MessageBody() data: any,
    @ConnectedSocket() socket: ISocket,
    @GetRoom('id') roomId: number,
  ): void {
    const response = this.codeService.updateDoc(roomId, socket, data);
    if (response) {
      socket.emit(CODE_EVENTS.UPDATE_YJS, response);
    }
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
  @SubscribeMessage(CODE_EVENTS.EXECUTE_CODE)
  executeCode(@GetRoom() room: Room): void {
    if (this.roomIdToCodeExecutionTimeouts.has(room.id)) {
      // Do nothing, since someone is already executing code
      return;
    }
    this.server.to(`${room.id}`).emit(CODE_EVENTS.EXECUTE_CODE);
    const hasStartedExecution = this.codeService.executeCode(room);
    if (!hasStartedExecution) {
      this.server.to(`${room.id}`).emit(CODE_EVENTS.FAILED_TO_START_EXECUTION);
      return;
    }
    this.clearRoomTimeout(room.id);
    const timeout = setTimeout(() => {
      this.cancelExecution(room.id);
    }, CODE_EXECUTION_AUTO_CANCEL_DURATION);
    this.roomIdToCodeExecutionTimeouts.set(room.id, timeout);
  }

  onModuleDestroy(): void {
    [...this.roomIdToCodeExecutionTimeouts.keys()].map((roomId) =>
      this.clearRoomTimeout(roomId),
    );
  }

  private cancelExecution(roomId: number): void {
    this.server.to(`${roomId}`).emit(CODE_EVENTS.EXECUTION_TIMED_OUT);
  }

  private clearRoomTimeout(roomId: number): void {
    clearTimeout(this.roomIdToCodeExecutionTimeouts.get(roomId));
    this.roomIdToCodeExecutionTimeouts.delete(roomId);
  }
}
