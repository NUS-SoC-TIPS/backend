import { Injectable } from '@nestjs/common';
import { Room } from '@prisma/client';

import { ISocket } from '../../interfaces/socket';

@Injectable()
export class RoomsDataStructure {
  private roomToSockets: Map<number, ISocket[]>;
  private roomToTimeouts: Map<number, NodeJS.Timeout>;

  constructor() {
    this.roomToSockets = new Map();
    this.roomToTimeouts = new Map();
  }

  joinRoom(room: Room, socket: ISocket): void {
    if (!this.roomToSockets.has(room.id)) {
      this.roomToSockets.set(room.id, []);
    }
    this.roomToSockets.get(room.id).push(socket);

    if (this.roomToTimeouts.has(room.id)) {
      clearTimeout(this.roomToTimeouts.get(room.id));
      this.roomToTimeouts.delete(room.id);
    }
  }
}
