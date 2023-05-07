import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { ROOM_EVENTS } from '../rooms.constants';

@Catch()
export class JoinRoomExceptionFilter implements ExceptionFilter {
  catch(_exception: unknown, host: ArgumentsHost): void {
    const socket = host.switchToWs().getClient();
    socket.emit(ROOM_EVENTS.JOIN_ROOM_FAILED);
  }
}
