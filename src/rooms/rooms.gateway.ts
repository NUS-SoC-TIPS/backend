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

    // TODO: Fetch comments via comment service
    const { code, language } = this.codeService.findCode(room);
    const videoToken = this.agoraService.generateAccessToken(room.id, user.id);
    const partner = room.roomUsers.filter((u) => u.userId !== user.id)[0]?.user;

    return { partner, videoToken, code, language };
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(ROOM_EVENTS.CLOSE_ROOM)
  closeRoom(@GetRoom() room: Room): Promise<void> {
    return this.closeRoomHelper(room, false);
  }

  handleDisconnect(@ConnectedSocket() socket: ISocket): void {
    if (!socket.room) {
      return;
    }
    this.removeSocketFromRoomStructures(socket, socket.room);
  }

  private async closeRoomHelper(room: Room, isAuto: boolean): Promise<void> {
    // TODO: Grab code from code service and persist it somehow + clean up on code
    // TODO: Also do the same with the comments written + clean up on comments
    await this.roomsService.closeRoom(room.id, isAuto);
    this.server.to(`${room.id}`).emit(ROOM_EVENTS.ALREADY_IN_ROOM);
    this.removeRoomFromRoomStructures(room);
  }

  private addSocketToRoomStructures(socket: ISocket, room: Room): void {
    if (!this.roomIdToSockets.has(room.id)) {
      this.roomIdToSockets.set(room.id, []);
    }
    this.roomIdToSockets.get(room.id).push(socket);
    this.clearRoomTimeout(room);
    socket.join(`${room.id}`);
    socket.room = room;
  }

  private removeSocketFromRoomStructures(socket: ISocket, room: Room): void {
    if (!this.roomIdToSockets.has(room.id)) {
      // Invariant violated
      return;
    }
    const sockets = this.roomIdToSockets
      .get(room.id)
      .filter((s) => s.id !== socket.id);
    this.roomIdToSockets.set(room.id, sockets);
    socket.room = undefined;
    socket.leave(`${room.id}`);

    // If there's nobody left in the room, we set it to autoclose in 30 minutes
    if (sockets.length === 0) {
      this.clearRoomTimeout(room);
      const timeout = setTimeout(() => {
        this.closeRoomHelper(room, true);
      }, 1800000);
      this.roomIdToTimeouts.set(room.id, timeout);
    }
  }

  private removeRoomFromRoomStructures(room: Room): void {
    if (!this.roomIdToSockets.has(room.id)) {
      return;
    }
    this.roomIdToSockets.get(room.id).forEach((s) => {
      s.room = undefined;
      s.leave(`${room.id}`);
    });
    this.roomIdToSockets.delete(room.id);
    this.clearRoomTimeout(room);
  }

  private clearRoomTimeout(room: Room): void {
    if (this.roomIdToTimeouts.has(room.id)) {
      clearTimeout(this.roomIdToTimeouts.get(room.id));
      this.roomIdToTimeouts.delete(room.id);
    }
  }
}
