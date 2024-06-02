import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { ISocket } from '../../infra/interfaces/socket';
import { Room } from '../../infra/prisma/generated';

export const GetRoom = createParamDecorator(
  (
    data: string | undefined,
    ctx: ExecutionContext,
  ): Room | number | string | Date | undefined => {
    const socket: ISocket = ctx.switchToWs().getClient<ISocket>();
    if (data) {
      return socket.room?.[data] as number | string | Date | undefined;
    }
    return socket.room;
  },
);
