import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserRest = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
