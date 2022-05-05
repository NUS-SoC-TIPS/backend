import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JsonWebTokenError } from 'jsonwebtoken';

@Catch(JsonWebTokenError)
export class JsonWebTokenExceptionFilter implements ExceptionFilter {
  catch(_exception: JsonWebTokenError, host: ArgumentsHost): void {
    const socket = host.switchToWs().getClient();
    socket.emit('exception', { statusCode: 400, message: 'Invalid token' });
  }
}
