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
import { CallbackDto } from './dtos';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
  },
})
export class CodeGateway implements OnModuleDestroy {
  @WebSocketServer()
  server: Server;
  private roomIdToCodeExecutionTimeouts: Map<number, NodeJS.Timeout>;
  private submissionTokenToRoomId: Map<string, number>;

  constructor(private readonly codeService: CodeService) {
    this.roomIdToCodeExecutionTimeouts = new Map();
    this.submissionTokenToRoomId = new Map();
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
  async executeCode(@GetRoom() room: Room): Promise<void> {
    if (this.roomIdToCodeExecutionTimeouts.has(room.id)) {
      // Do nothing, since someone is already executing code
      return;
    }

    // Let the frontend know the code is executing
    this.server.to(`${room.id}`).emit(CODE_EVENTS.EXECUTE_CODE);
    const submissionToken = await this.codeService.executeCode(room);
    if (submissionToken == null) {
      this.server.to(`${room.id}`).emit(CODE_EVENTS.FAILED_TO_START_EXECUTION);
      return;
    }

    this.submissionTokenToRoomId.set(submissionToken, room.id);
    const timeout = setTimeout(() => {
      this.cancelExecution(room.id);
    }, CODE_EXECUTION_AUTO_CANCEL_DURATION);
    this.roomIdToCodeExecutionTimeouts.set(room.id, timeout);
  }

  completeExecution(dto: CallbackDto): void {
    const roomId = this.submissionTokenToRoomId.get(dto.token);
    if (roomId == null) {
      // Token somehow cleared
      return;
    }
    this.submissionTokenToRoomId.delete(dto.token);
    const timeout = this.roomIdToCodeExecutionTimeouts.get(roomId);
    if (timeout == null) {
      // Execution was cancelled
      return;
    }
    clearTimeout(timeout);
    this.roomIdToCodeExecutionTimeouts.delete(roomId);
    const result = this.codeService.interpretResults(dto);
    this.server.to(`${roomId}`).emit(CODE_EVENTS.EXECUTION_COMPLETED, result);
  }

  onModuleDestroy(): void {
    [...this.roomIdToCodeExecutionTimeouts.keys()].map((roomId) =>
      this.clearRoomTimeout(roomId),
    );
  }

  private cancelExecution(roomId: number): void {
    this.server.to(`${roomId}`).emit(CODE_EVENTS.EXECUTION_TIMED_OUT);
    this.clearRoomTimeout(roomId);
  }

  private clearRoomTimeout(roomId: number): void {
    clearTimeout(this.roomIdToCodeExecutionTimeouts.get(roomId));
    this.roomIdToCodeExecutionTimeouts.delete(roomId);
  }
}
