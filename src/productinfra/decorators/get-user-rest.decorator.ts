import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '../../infra/prisma/generated';

export const GetUserRest = createParamDecorator(
  (
    data: string | undefined,
    ctx: ExecutionContext,
  ): User | string | Date | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: User }>();
    if (data) {
      return request.user?.[data] as string | Date | undefined;
    }
    return request.user;
  },
);
