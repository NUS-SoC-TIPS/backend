import { UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { User } from '@prisma/client';
import { ISocket } from 'src/interfaces/socket';
import { PrismaService } from 'src/prisma/prisma.service';

import { AUTH_EVENTS } from './auth.constants';
import { JsonWebTokenExceptionFilter } from './filters';

@WebSocketGateway()
export class AuthGateway {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  @SubscribeMessage(AUTH_EVENTS.AUTHENTICATE)
  @UseFilters(JsonWebTokenExceptionFilter)
  async authenticate(
    @MessageBody('bearerToken') token: string,
    @ConnectedSocket() socket: ISocket,
  ): Promise<{ user: User }> {
    const payload = await this.jwtService.verifyAsync(token);
    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });
    if (!user) {
      throw new WsException('Invalid token');
    }
    socket.user = user;
    return { user };
  }
}
