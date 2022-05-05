import { UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { User } from '@prisma/client';

import { ISocket } from '../interfaces/socket';
import { PrismaService } from '../prisma/prisma.service';

import { AUTH_EVENTS } from './auth.constants';
import { JsonWebTokenExceptionFilter } from './filters';

@WebSocketGateway()
export class AuthGateway implements OnGatewayConnection {
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

  handleConnection(@ConnectedSocket() socket: ISocket): void {
    setTimeout(() => {
      // If after 1 second, the socket still hasn't authenticated itself, then we will kick.
      if (socket.user == null) {
        socket.disconnect();
      }
    }, 1000);
  }
}
