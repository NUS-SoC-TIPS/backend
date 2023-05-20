import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { ISocket } from '../../infra/interfaces/socket';

@Injectable()
export class AuthWsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const socket: ISocket = context.switchToWs().getClient();
    if (socket.user == null) {
      throw new WsException('Unauthorized');
    }
    return true;
  }
}
