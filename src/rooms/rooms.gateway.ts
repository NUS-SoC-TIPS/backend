import { UseGuards, ValidationPipe } from '@nestjs/common';
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
import { InRoomGuard } from './guards';
import { ROOM_EVENTS } from './rooms.constants';
import { RoomsService } from './rooms.service';

@WebSocketGateway()
export class RoomsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private roomIdToSockets: Map<number, ISocket[]>;
  private roomIdToTimeouts: Map<number, NodeJS.Timeout>;

  constructor(
    private roomsService: RoomsService,
    private agoraService: AgoraService,
    private codeService: CodeService,
    private notesService: NotesService,
  ) {
    this.roomIdToSockets = new Map();
    this.roomIdToTimeouts = new Map();
  }

  @UseGuards(AuthWsGuard)
  @SubscribeMessage(ROOM_EVENTS.JOIN_ROOM)
  async joinRoom(
    @MessageBody('slug', new ValidationPipe()) slug: string,
    @GetUserWs() user: User,
    @ConnectedSocket() socket: ISocket,
  ): Promise<any> {
    const room = await this.roomsService.findBySlug(slug);
    if (!room) {
      return { event: ROOM_EVENTS.ROOM_DOES_NOT_EXIST };
    }

    // Do corresponding checks
    const userCurrentRoom = socket.room;
    const userInAnotherRoom = userCurrentRoom && userCurrentRoom.slug !== slug;
    if (userInAnotherRoom) {
      return { event: ROOM_EVENTS.ALREADY_IN_ROOM };
    }
    if (room.status !== RoomStatus.OPEN) {
      return { event: ROOM_EVENTS.ROOM_IS_CLOSED };
    }
    if (room.roomUsers.length === 2 && userCurrentRoom == null) {
      return { event: ROOM_EVENTS.ROOM_IS_FULL };
    }

    // Update relevant data
    this.addSocketToRoomStructures(socket, room);
    this.roomsService.createRoomUser({ roomId: room.id, userId: user.id });
    socket.broadcast
      .to(`${room.id}`)
      .emit(ROOM_EVENTS.JOINED_ROOM, { partner: user });

    const { code, language } = this.codeService.findCode(room.id);
    const notes = this.notesService.findForUserInRoom(room.id, user.id);
    const videoToken = this.agoraService.generateAccessToken(room.id, user.id);
    const partner = room.roomUsers.filter((u) => u.userId !== user.id)[0]?.user;

    return { partner, videoToken, code, language, notes };
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(ROOM_EVENTS.CLOSE_ROOM)
  closeRoom(@GetRoom('id') roomId: number): Promise<void> {
    return this.closeRoomHelper(roomId, false);
  }

  handleDisconnect(@ConnectedSocket() socket: ISocket): void {
    if (!socket.room) {
      return;
    }
    this.removeSocketFromRoomStructures(socket, socket.room.id);
  }

  private async closeRoomHelper(
    roomId: number,
    isAuto: boolean,
  ): Promise<void> {
    // TODO: Grab code from code service and persist it somehow + clean up on code
    // TODO: Also do the same with the comments written + clean up on comments
    await this.roomsService.closeRoom(roomId, isAuto);
    this.server.to(`${roomId}`).emit(ROOM_EVENTS.ALREADY_IN_ROOM);
    this.removeRoomFromRoomStructures(roomId);
  }

  // This is the only method that needs to take in Room instead of just id,
  // because we need to link it to the socket.
  private addSocketToRoomStructures(socket: ISocket, room: Room): void {
    if (!this.roomIdToSockets.has(room.id)) {
      this.roomIdToSockets.set(room.id, []);
    }
    this.roomIdToSockets.get(room.id).push(socket);
    this.clearRoomTimeout(room.id);
    socket.join(`${room.id}`);
    socket.room = room;
  }

  private removeSocketFromRoomStructures(
    socket: ISocket,
    roomId: number,
  ): void {
    if (!this.roomIdToSockets.has(roomId)) {
      // Invariant violated
      return;
    }
    const sockets = this.roomIdToSockets
      .get(roomId)
      .filter((s) => s.id !== socket.id);
    this.roomIdToSockets.set(roomId, sockets);
    socket.room = undefined;
    socket.leave(`${roomId}`);

    // If there's nobody left in the room, we set it to autoclose in 30 minutes
    if (sockets.length === 0) {
      this.clearRoomTimeout(roomId);
      const timeout = setTimeout(() => {
        this.closeRoomHelper(roomId, true);
      }, 1800000);
      this.roomIdToTimeouts.set(roomId, timeout);
    }
  }

  private removeRoomFromRoomStructures(roomId: number): void {
    if (!this.roomIdToSockets.has(roomId)) {
      return;
    }
    this.roomIdToSockets.get(roomId).forEach((s) => {
      s.room = undefined;
      s.leave(`${roomId}`);
    });
    this.roomIdToSockets.delete(roomId);
    this.clearRoomTimeout(roomId);
  }

  private clearRoomTimeout(roomId: number): void {
    if (this.roomIdToTimeouts.has(roomId)) {
      clearTimeout(this.roomIdToTimeouts.get(roomId));
      this.roomIdToTimeouts.delete(roomId);
    }
  }
}
