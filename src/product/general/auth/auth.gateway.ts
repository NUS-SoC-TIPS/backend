import { Logger, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';

import { ISocket } from '../../../infra/interfaces/socket';

import { AUTH_EVENTS, AUTO_KICK_WAIT_TIME_MS } from './auth.constants';
import { AuthService } from './auth.service';
import { JsonWebTokenExceptionFilter } from './filters';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
  },
})
export class AuthGateway implements OnGatewayConnection {
  constructor(
    private readonly logger: Logger,
    private readonly authService: AuthService,
  ) {}

  @SubscribeMessage(AUTH_EVENTS.AUTHENTICATE)
  @UseFilters(JsonWebTokenExceptionFilter)
  async authenticate(
    @MessageBody('bearerToken') token: string,
    @ConnectedSocket() socket: ISocket,
  ): Promise<void> {
    this.logger.log(AUTH_EVENTS.AUTHENTICATE, AuthGateway.name);

    const user = await this.authService
      .authenticate(token)
      .catch((e: unknown) => {
        if (e instanceof Error) {
          throw new WsException(e.message);
        }
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
