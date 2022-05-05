import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Room, RoomStatus, User } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Server } from 'socket.io';

import { GetUserWs } from '../auth/decorators';
import { AuthWsGuard } from '../auth/guards';
import { ISocket } from '../interfaces/socket';

import { GetRoom } from './decorators';
import { InRoomGuard } from './guards';
import { ROOM_EVENTS } from './rooms.constants';
import { RoomsService } from './rooms.service';

@WebSocketGateway()
export class RoomsGateway {
  @WebSocketServer()
  server: Server;
  private roomIdToSockets: Map<number, ISocket[]>;
  private roomIdToTimeouts: Map<number, NodeJS.Timeout>;

  constructor(private roomsService: RoomsService) {
    this.roomIdToSockets = new Map();
    this.roomIdToTimeouts = new Map();
  }

  @UseGuards(AuthWsGuard)
  @SubscribeMessage(ROOM_EVENTS.JOIN_ROOM)
  async joinRoom(
    @MessageBody('slug') slug: string,
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

    // TODO: Fetch coding information via code service
    // TODO: Generate video information via video service
    const partner = room.roomUsers.filter((u) => u.userId !== user.id)[0]?.user;

    return { partner };
  }

  @UseGuards(AuthWsGuard, InRoomGuard)
  @SubscribeMessage(ROOM_EVENTS.CLOSE_ROOM)
  async closeRoom(@GetRoom() room: Room): Promise<void> {
    // TODO: Grab code from code service and persist it somehow
    // TODO: Also do the same with the comments written
    await this.roomsService.closeRoom(room.id, false);
    this.server.to(`${room.id}`).emit(ROOM_EVENTS.ALREADY_IN_ROOM);
    this.removeRoomFromRoomStructures(room);
  }

  private addSocketToRoomStructures(socket: ISocket, room: Room): void {
    if (!this.roomIdToSockets.has(room.id)) {
      this.roomIdToSockets.set(room.id, []);
    }
    this.roomIdToSockets.get(room.id).push(socket);
    if (this.roomIdToTimeouts.has(room.id)) {
      clearTimeout(this.roomIdToTimeouts.get(room.id));
      this.roomIdToTimeouts.delete(room.id);
    }
    socket.join(`${room.id}`);
    socket.room = room;
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
    if (this.roomIdToTimeouts.has(room.id)) {
      clearTimeout(this.roomIdToTimeouts.get(room.id));
      this.roomIdToTimeouts.delete(room.id);
    }
  }
}
