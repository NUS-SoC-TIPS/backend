import { Socket } from 'socket.io';

import { Room, User } from '../prisma/generated';

export interface ISocket extends Socket {
  user?: User;
  room?: Room;
}
