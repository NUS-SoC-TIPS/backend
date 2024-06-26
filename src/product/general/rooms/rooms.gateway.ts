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
import { Server } from 'socket.io';

import { ISocket } from '../../../infra/interfaces/socket';
import { Room, RoomStatus, User } from '../../../infra/prisma/generated';
import { AgoraService } from '../../../productinfra/agora/agora.service';
import { GetRoom, GetUserWs } from '../../../productinfra/decorators';
import { AuthWsGuard, InRoomGuard } from '../../../productinfra/guards';
import { makeUserBase } from '../../interfaces';
import { CodeService } from '../code/code.service';
import { NotesService } from '../notes/notes.service';

import { CloseRoomExceptionFilter, JoinRoomExceptionFilter } from './filters';
import { ROOM_AUTOCLOSE_DURATION, ROOM_EVENTS } from './rooms.constants';
import { CreateRecordData } from './rooms.interfaces';
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
    private readonly logger: Logger,
    private readonly codeService: CodeService,
    private readonly agoraService: AgoraService,
    private readonly notesService: NotesService,
    private readonly roomsService: RoomsService,
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
    const room = await this.roomsService.findRoomAndRoomUsersBySlug(slug);
    if (!room) {
      socket.emit(ROOM_EVENTS.ROOM_DOES_NOT_EXIST);
      return;
    }

    // Do corresponding checks
    const userCurrentRoom = (
      await this.roomsService.findCurrentRoomUserAndRoomForUser(user.id)
    )?.room;
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
        users: room.roomUsers.map((u) => makeUserBase(u.user)),
      });
      return;
    }

    const userSocketsInRoom = this.roomIdToSockets
      .get(room.id)
      ?.filter((s) => s.user?.id === user.id);
    if ((userSocketsInRoom?.length ?? 0) > 0) {
      // This means that the user is already in this room, just using another browser tab.
      socket.emit(ROOM_EVENTS.IN_ANOTHER_TAB);
      return;
    }

    // Update relevant data
    await this.addSocketToRoomStructures(socket, room);
    // This is the final point of failure. Subsequently, no following steps should throw an error.
    await this.roomsService.createRoomUser({
      roomId: room.id,
      userId: user.id,
    });
    socket.broadcast
      .to(`${room.id}`)
      // TODO: Consider adding other properties if e.g. UI is redesigned
      .emit(ROOM_EVENTS.JOINED_ROOM, { partner: { name: user.name } });

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
      partner: partner != null ? { name: partner.name } : null,
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
    return this.closeRoomHelper(room, false).catch((e: unknown) => {
      this.logger.error(
        `Failed to close room with ID: ${room.id}`,
        e instanceof Error ? e.stack : undefined,
        RoomsGateway.name,
      );
      throw e;
    });
  }

  async handleDisconnect(@ConnectedSocket() socket: ISocket): Promise<void> {
    if (!socket.room) {
      return;
    }
    this.logger.log(
      `Socket with ID: ${socket.id} disconnected`,
      RoomsGateway.name,
    );
    const { room } = socket;
    await this.removeSocketFromRoomStructures(socket, room);
    this.codeService.leaveDoc(room.id, socket);
    this.server.to(`${room.id}`).emit(ROOM_EVENTS.PARTNER_DISCONNECTED);
  }

  onModuleDestroy(): Promise<unknown[]> {
    this.logger.log('Destroying module...', RoomsGateway.name);
    return Promise.all(
      [...this.roomIdToSockets.keys()].map((roomId) =>
        this.roomsService.findRoomById(roomId).then((room) => {
          if (room) {
            return this.closeRoomHelper(room, true).catch((e: unknown) => {
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
    const recordData: CreateRecordData = {
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
    await this.removeRoomFromRoomStructures(room.id);
  }

  // This method needs to take in Room instead of just id, because we need
  // to link it to the socket.
  private async addSocketToRoomStructures(
    socket: ISocket,
    room: Room,
  ): Promise<void> {
    let sockets = this.roomIdToSockets.get(room.id);
    if (sockets == null) {
      sockets = [];
      this.roomIdToSockets.set(room.id, sockets);
    }
    sockets.push(socket);
    this.clearRoomTimeout(room.id);
    await socket.join(`${room.id}`);
    socket.room = room;
  }

  private async removeSocketFromRoomStructures(
    socket: ISocket,
    room: Room,
  ): Promise<void> {
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
    await socket.leave(`${room.id}`);

    // If there's nobody left in the room, we set it to autoclose in ROOM_AUTOCLOSE_DURATION
    if (updatedSockets.length === 0) {
      this.clearRoomTimeout(room.id);
      const timeout = setTimeout(() => {
        this.closeRoomHelper(room, true).catch((e: unknown) => {
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

  private async removeRoomFromRoomStructures(roomId: number): Promise<void> {
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
    await Promise.all(
      sockets.map(async (s) => {
        s.room = undefined;
        await s.leave(`${roomId}`);
      }),
    );
    this.roomIdToSockets.delete(roomId);
    this.clearRoomTimeout(roomId);
  }

  private clearRoomTimeout(roomId: number): void {
    clearTimeout(this.roomIdToTimeouts.get(roomId));
    this.roomIdToTimeouts.delete(roomId);
  }
}
