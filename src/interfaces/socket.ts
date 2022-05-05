import { User } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Socket } from 'socket.io';

export interface ISocket extends Socket {
  user?: User;
}
