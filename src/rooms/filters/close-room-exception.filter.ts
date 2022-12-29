import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { ROOM_EVENTS } from '../rooms.constants';

@Catch()
export class CloseRoomExceptionFilter implements ExceptionFilter {
  catch(_exception: unknown, host: ArgumentsHost): void {
    const socket = host.switchToWs().getClient();
    socket.emit(ROOM_EVENTS.CLOSE_ROOM_FAILED);
  }
}
