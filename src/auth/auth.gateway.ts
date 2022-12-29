import { Logger, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';

import { ISocket } from '../interfaces/socket';
import { PrismaService } from '../prisma/prisma.service';

import { AUTH_EVENTS, AUTO_KICK_WAIT_TIME_MS } from './auth.constants';
import { JsonWebTokenExceptionFilter } from './filters';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
  },
})
export class AuthGateway implements OnGatewayConnection {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  @SubscribeMessage(AUTH_EVENTS.AUTHENTICATE)
  @UseFilters(JsonWebTokenExceptionFilter)
  async authenticate(
    @MessageBody('bearerToken') token: string,
    @ConnectedSocket() socket: ISocket,
  ): Promise<void> {
    this.logger.debug('Authenticating socket...', AuthGateway.name);
    const payload = await this.jwtService
      .verifyAsync(token)
      .catch((e: Error) => {
        this.logger.error(
          'Failed to verify token async',
          e.stack,
          AuthGateway.name,
        );
        throw new WsException('Invalid token');
      });

    const user = await this.prismaService.user.findUnique({
      where: {
        id: payload.sub,
      },
    });
    if (!user) {
      this.logger.error(
        'No user found with given token',
        undefined,
        AuthGateway.name,
      );
      throw new WsException('Invalid token');
    }

    this.logger.debug('Socket authenticated!', AuthGateway.name);
    socket.user = user;
    socket.emit(AUTH_EVENTS.AUTHENTICATE, { user });
  }

  handleConnection(@ConnectedSocket() socket: ISocket): void {
    setTimeout(() => {
      // If after 1 second, the socket still hasn't authenticated itself, then we will kick.
      if (socket.user == null) {
        this.logger.error(
          `Socket is not authenticated even after ${AUTO_KICK_WAIT_TIME_MS}ms`,
          undefined,
          AuthGateway.name,
        );
        socket.disconnect();
      }
    }, AUTO_KICK_WAIT_TIME_MS);
  }
}
