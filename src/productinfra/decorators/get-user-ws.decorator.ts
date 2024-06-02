import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { ISocket } from '../../infra/interfaces/socket';
import { User } from '../../infra/prisma/generated';

export const GetUserWs = createParamDecorator(
  (
    data: string | undefined,
    ctx: ExecutionContext,
  ): User | string | Date | undefined => {
    const socket = ctx.switchToWs().getClient<ISocket>();
    if (data) {
      return socket.user?.[data] as string | Date | undefined;
    }
    return socket.user;
  },
);
