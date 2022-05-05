import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { RoomStatus, User } from '@prisma/client';

import { UserWs } from '../auth/decorators';
import { AuthWsGuard } from '../auth/guards';
import { ISocket } from '../interfaces/socket';

import { RoomsDataStructure } from './data-structures/rooms.data-structure';
import { ROOM_EVENTS } from './rooms.constants';
import { RoomsService } from './rooms.service';

@WebSocketGateway()
export class RoomsGateway {
  constructor(
    private roomsService: RoomsService,
    private roomsDataStructure: RoomsDataStructure,
  ) {}

  @UseGuards(AuthWsGuard)
  @SubscribeMessage(ROOM_EVENTS.JOIN_ROOM)
  async joinRoom(
    @MessageBody('slug') slug: string,
    @UserWs() user: User,
    @ConnectedSocket() socket: ISocket,
  ): Promise<any> {
    const room = await this.roomsService.findBySlug(slug);
    if (!room) {
      return { event: ROOM_EVENTS.ROOM_DOES_NOT_EXIST };
    }

    // Do corresponding checks
    const existingRoom = socket.room;
    const userInAnotherRoom = existingRoom && existingRoom.slug !== slug;
    if (userInAnotherRoom) {
      return { event: ROOM_EVENTS.ALREADY_IN_ROOM };
    }
    if (room.status !== RoomStatus.OPEN) {
      return { event: ROOM_EVENTS.ROOM_IS_CLOSED };
    }
    if (room.roomUsers.length === 2 && existingRoom == null) {
      return { event: ROOM_EVENTS.ROOM_IS_FULL };
    }

    // Update relevant data
    const roomId = `${room.id}`;
    socket.join(roomId);
    socket.room = room;
    this.roomsDataStructure.joinRoom(room, socket);
    this.roomsService.createRoomUser({ roomId: room.id, userId: user.id });
    socket.broadcast
      .to(roomId)
      .emit(ROOM_EVENTS.JOINED_ROOM, { partner: user });

    // TODO: Fetch coding information via code service
    // TODO: Generate video information via video service
    const partner = room.roomUsers.filter((u) => u.userId !== user.id)[0]?.user;

    return { partner };
  }
}
