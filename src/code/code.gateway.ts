import {
  Logger,
  OnModuleDestroy,
  ParseEnumPipe,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { CallbackDto } from '../judge0/dtos';
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
  private submissionTokenToRoomId: Map<string, number>;

  constructor(
    private readonly codeService: CodeService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.roomIdToCodeExecutionTimeouts = new Map();
    this.submissionTokenToRoomId = new Map();
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.CONNECT_YJS)
  connectYjs(@ConnectedSocket() socket: ISocket, @GetRoom() room: Room): void {
    this.logger.log(CODE_EVENTS.CONNECT_YJS, CodeGateway.name);
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
    this.logger.log(CODE_EVENTS.UPDATE_YJS, CodeGateway.name);
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
    this.logger.log(CODE_EVENTS.UPDATE_LANGUAGE, CodeGateway.name);
    this.codeService.updateLanguage(roomId, language);
    socket.broadcast
      .to(`${roomId}`)
      .emit(CODE_EVENTS.UPDATE_LANGUAGE, language);
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(CODE_EVENTS.EXECUTE_CODE)
  async executeCode(@GetRoom() room: Room): Promise<void> {
    this.logger.log(CODE_EVENTS.EXECUTE_CODE, CodeGateway.name);
    if (this.roomIdToCodeExecutionTimeouts.has(room.id)) {
      this.logger.warn(
        'User requested to execute code despite code already executing for room',
        CodeGateway.name,
      );
      return;
    }

    // Let the frontend know the code is executing
    this.server.to(`${room.id}`).emit(CODE_EVENTS.EXECUTE_CODE);

    // If we're in development, we want to skip the use of webhooks, so we'll execute the code synchronously
    if (this.configService.get('NODE_ENV') === 'development') {
      const result = await this.codeService.executeCodeSync(room);
      if (result == null) {
        this.server
          .to(`${room.id}`)
          .emit(CODE_EVENTS.FAILED_TO_START_EXECUTION);
        return;
      }
      this.server
        .to(`${room.id}`)
        .emit(CODE_EVENTS.EXECUTION_COMPLETED, result);
      return;
    }

    // Else, we'll make use of webhooks to execute the code asynchronously
    const submissionToken = await this.codeService.executeCodeAsync(room);
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
      this.logger.warn(
        `Token ${dto.token} was somehow previously cleared`,
        CodeGateway.name,
      );
      return;
    }
    this.submissionTokenToRoomId.delete(dto.token);
    const timeout = this.roomIdToCodeExecutionTimeouts.get(roomId);
    if (timeout == null) {
      this.logger.log(
        'Code execution has been cancelled due to timeout',
        CodeGateway.name,
      );
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
    this.logger.warn(
      `Cancelling code execution due to timeout for room with ID: ${roomId}`,
      CodeGateway.name,
    );
    this.server.to(`${roomId}`).emit(CODE_EVENTS.EXECUTION_TIMED_OUT);
    this.clearRoomTimeout(roomId);
  }

  private clearRoomTimeout(roomId: number): void {
    clearTimeout(this.roomIdToCodeExecutionTimeouts.get(roomId));
    this.roomIdToCodeExecutionTimeouts.delete(roomId);
  }
}
