import {
  Logger,
  OnModuleDestroy,
  UseFilters,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Room, RoomStatus, User } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Server } from 'socket.io';

import { AgoraService } from '../agora/agora.service';
import { GetUserWs } from '../auth/decorators';
import { AuthWsGuard } from '../auth/guards';
import { CodeService } from '../code/code.service';
import { ISocket } from '../interfaces/socket';
import { NotesService } from '../notes/notes.service';

import { GetRoom } from './decorators';
import { CreateRecordDto } from './dtos';
import { CloseRoomExceptionFilter, JoinRoomExceptionFilter } from './filters';
import { InRoomGuard } from './guards';
import { ROOM_AUTOCLOSE_DURATION, ROOM_EVENTS } from './rooms.constants';
import { RoomsService } from './rooms.service';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
  },
})
export class RoomsGateway implements OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server: Server;
  private roomIdToSockets: Map<number, ISocket[]>;
  private roomIdToTimeouts: Map<number, NodeJS.Timeout>;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly agoraService: AgoraService,
    private readonly codeService: CodeService,
    private readonly notesService: NotesService,
    private readonly logger: Logger,
  ) {
    this.roomIdToSockets = new Map();
    this.roomIdToTimeouts = new Map();
  }

  @UseGuards(AuthWsGuard)
  @UseFilters(JoinRoomExceptionFilter)
  @SubscribeMessage(ROOM_EVENTS.JOIN_ROOM)
  async joinRoom(
    @MessageBody('slug', new ValidationPipe()) slug: string,
    @GetUserWs() user: User,
    @ConnectedSocket() socket: ISocket,
  ): Promise<void> {
    this.logger.log(ROOM_EVENTS.JOIN_ROOM, RoomsGateway.name);
    const room = await this.roomsService.findBySlug(slug);
    if (!room) {
      socket.emit(ROOM_EVENTS.ROOM_DOES_NOT_EXIST);
      return;
    }

    // Do corresponding checks
    const userCurrentRoom = await this.roomsService.findCurrent(user.id);
    const userInAnotherRoom = userCurrentRoom && userCurrentRoom.slug !== slug;
    if (userInAnotherRoom) {
      socket.emit(ROOM_EVENTS.ALREADY_IN_ROOM, { slug: userCurrentRoom.slug });
      return;
    }
    if (room.status !== RoomStatus.OPEN) {
      socket.emit(ROOM_EVENTS.ROOM_IS_CLOSED);
      return;
    }
    if (room.roomUsers.length === 2 && userCurrentRoom == null) {
      socket.emit(ROOM_EVENTS.ROOM_IS_FULL, {
        users: room.roomUsers.map((u) => u.user),
      });
      return;
    }
    if (
      this.roomIdToSockets.get(room.id)?.filter((s) => s.user?.id === user.id)
        ?.length ??
      0 > 0
    ) {
      socket.emit(ROOM_EVENTS.IN_ANOTHER_TAB);
      return;
    }

    // Update relevant data
    this.addSocketToRoomStructures(socket, room);
    // This is the final point of failure. Subsequently, no following steps should throw an error.
    this.roomsService.createRoomUser({ roomId: room.id, userId: user.id });
    socket.broadcast
      .to(`${room.id}`)
      .emit(ROOM_EVENTS.JOINED_ROOM, { partner: user });

    const language = await this.codeService.findOrInitLanguage(
      room.id,
      user.id,
    );
    const notes = this.notesService.findForUserInRoom(room.id, user.id);
    const videoToken = this.agoraService.generateAccessToken(room.id, user.id);
    const partner = room.roomUsers.filter((u) => u.userId !== user.id)[0]?.user;
    const isPartnerInRoom = this.roomIdToSockets.get(room.id)?.length === 2;
    const executableLanguageToVersionMap =
      await this.codeService.getExecutableLanguages();

    socket.emit(ROOM_EVENTS.JOIN_ROOM, {
      id: room.id,
      partner,
      videoToken,
      language,
      notes,
      isPartnerInRoom,
      executableLanguageToVersionMap,
    });
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @UseFilters(CloseRoomExceptionFilter)
  @SubscribeMessage(ROOM_EVENTS.CLOSE_ROOM)
  closeRoom(@GetRoom() room: Room): Promise<void> {
    this.logger.log(ROOM_EVENTS.CLOSE_ROOM, RoomsGateway.name);
    return this.closeRoomHelper(room, false).catch((e) => {
      this.logger.error(
        `Failed to close room with ID: ${room.id}`,
        e instanceof Error ? e.stack : undefined,
        RoomsGateway.name,
      );
      throw e;
    });
  }

  handleDisconnect(@ConnectedSocket() socket: ISocket): void {
    if (!socket.room) {
      return;
    }
    this.logger.log(
      `Socket with ID: ${socket.id} disconnected`,
      RoomsGateway.name,
    );
    const { room } = socket;
    this.removeSocketFromRoomStructures(socket, room);
    this.codeService.leaveDoc(room.id, socket);
    this.server.to(`${room.id}`).emit(ROOM_EVENTS.PARTNER_DISCONNECTED);
  }

  onModuleDestroy(): Promise<void[]> {
    this.logger.log('Destroying module...', RoomsGateway.name);
    return Promise.all(
      [...this.roomIdToSockets.keys()].map((roomId) =>
        this.roomsService.findById(roomId).then((room) => {
          if (room) {
            return this.closeRoomHelper(room, true).catch((e) => {
              // We will consume the error here. It'll be a best effort attempt at closing room.
              this.logger.error(
                `Failed to close room with ID: ${roomId} during shutdown`,
                e instanceof Error ? e.stack : undefined,
                RoomsGateway.name,
              );
            });
          }
        }),
      ),
    );
  }

  private async closeRoomHelper(room: Room, isAuto: boolean): Promise<void> {
    this.server.to(`${room.id}`).emit(ROOM_EVENTS.CLOSING_ROOM);
    const { code, language } = this.codeService.getCodeAndLanguage(room);
    const userNotes = this.notesService.getNotes(room.id);
    const recordData: CreateRecordDto = {
      isRoleplay: false,
      duration: new Date().getTime() - room.createdAt.getTime(),
      roomId: room.id,
      language,
      codeWritten: code,
      roomRecordUsers: userNotes.map((notes) => ({
        ...notes,
        isInterviewer: false,
      })),
    };

    // No destructive actions before this step, which can fail
    await this.roomsService.closeRoom(recordData, isAuto);
    this.server.to(`${room.id}`).emit(ROOM_EVENTS.CLOSE_ROOM);
    this.codeService.closeRoom(room);
    this.notesService.closeRoom(room.id);
    this.removeRoomFromRoomStructures(room.id);
  }

  // This method needs to take in Room instead of just id, because we need
  // to link it to the socket.
  private addSocketToRoomStructures(socket: ISocket, room: Room): void {
    let sockets = this.roomIdToSockets.get(room.id);
    if (sockets == null) {
      sockets = [];
      this.roomIdToSockets.set(room.id, sockets);
    }
    sockets.push(socket);
    this.clearRoomTimeout(room.id);
    socket.join(`${room.id}`);
    socket.room = room;
  }

  private removeSocketFromRoomStructures(socket: ISocket, room: Room): void {
    const sockets = this.roomIdToSockets.get(room.id);
    if (sockets == null) {
      this.logger.error(
        'Room was attached to socket but does not exist in map',
        undefined,
        RoomsGateway.name,
      );
      return;
    }
    const updatedSockets = sockets.filter((s) => s.id !== socket.id);
    this.roomIdToSockets.set(room.id, updatedSockets);
    socket.room = undefined;
    socket.leave(`${room.id}`);

    // If there's nobody left in the room, we set it to autoclose in ROOM_AUTOCLOSE_DURATION
    if (updatedSockets.length === 0) {
      this.clearRoomTimeout(room.id);
      const timeout = setTimeout(() => {
        this.closeRoomHelper(room, true).catch((e) => {
          // We will consume the error here. No real harm if auto-close fails.
          this.logger.error(
            'Failed to autoclose room',
            e instanceof Error ? e.stack : undefined,
            RoomsGateway,
          );
        });
      }, ROOM_AUTOCLOSE_DURATION);
      this.roomIdToTimeouts.set(room.id, timeout);
    }
  }

  private removeRoomFromRoomStructures(roomId: number): void {
    const sockets = this.roomIdToSockets.get(roomId);
    if (sockets == null) {
      // This shouldn't occur, since an exception should already have occurred when trying to
      // close the room for the second time, so this method should never be called twice for
      // the same room.
      this.logger.error(
        'Room was somehow already removed',
        undefined,
        RoomsGateway.name,
      );
      return;
    }
    sockets.forEach((s) => {
      s.room = undefined;
      s.leave(`${roomId}`);
    });
    this.roomIdToSockets.delete(roomId);
    this.clearRoomTimeout(roomId);
  }

  private clearRoomTimeout(roomId: number): void {
    clearTimeout(this.roomIdToTimeouts.get(roomId));
    this.roomIdToTimeouts.delete(roomId);
  }
}
