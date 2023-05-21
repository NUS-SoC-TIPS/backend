import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { PrismaService } from './infra/prisma/prisma.service';
import { AppModule } from './app.module';

function getWinstonFormat(isConsole: boolean): winston.Logform.Format {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('tips-backend', {
      colors: isConsole,
      prettyPrint: isConsole,
    }),
  );
}

const errorTransport = new DailyRotateFile({
  level: 'error',
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  maxSize: '20m',
  maxFiles: '14d',
  format: getWinstonFormat(false),
});

const combinedTransport = new DailyRotateFile({
  level: 'info',
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  maxSize: '20m',
  maxFiles: '14d',
  format: getWinstonFormat(false),
});

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
    },
    logger: WinstonModule.createLogger({
      transports: [
        errorTransport,
        combinedTransport,
        new winston.transports.Console({
          format: getWinstonFormat(true),
          // info < verbose < debug
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: 'logs/exceptions.log',
          format: getWinstonFormat(false),
        }),
      ],
    }),
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidUnknownValues: false }),
  );
  const prismaService = app.get(PrismaService);
  const configService = app.get(ConfigService);
  await prismaService.enableShutdownHooks(app);
  app.enableCors();
  await app.listen(configService.get('PORT') ?? 3001);
}

bootstrap();
