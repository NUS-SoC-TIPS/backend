import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { ISocket } from '../../../../infra/interfaces/socket';

export const GetRoom = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const socket: ISocket = ctx.switchToWs().getClient();
    if (data) {
      return socket.room?.[data];
    }
    return socket.room;
  },
);
