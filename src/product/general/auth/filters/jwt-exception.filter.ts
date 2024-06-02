import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { JsonWebTokenError } from 'jsonwebtoken';

import { ISocket } from '../../../../infra/interfaces/socket';

@Catch(JsonWebTokenError)
export class JsonWebTokenExceptionFilter implements ExceptionFilter {
  catch(_exception: JsonWebTokenError, host: ArgumentsHost): void {
    const socket = host.switchToWs().getClient<ISocket>();
    socket.emit('exception', { status: 'error', message: 'Invalid token' });
  }
}
