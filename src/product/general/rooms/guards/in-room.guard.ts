import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { ISocket } from '../../../../infra/interfaces/socket';

@Injectable()
export class InRoomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const socket: ISocket = context.switchToWs().getClient();
    if (socket.room == null) {
      throw new WsException(
        'You need to be in a room to perform this operation',
      );
    }
    return true;
  }
}
