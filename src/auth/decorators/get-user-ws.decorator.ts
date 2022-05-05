import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { ISocket } from '../../interfaces/socket';

export const GetUserWs = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const socket: ISocket = ctx.switchToWs().getClient();
    if (data) {
      return socket.user?.[data];
    }
    return socket.user;
  },
);
