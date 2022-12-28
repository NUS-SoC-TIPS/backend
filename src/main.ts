import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';

import { PrismaService } from './prisma/prisma.service';
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

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
    },
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.File({
          filename: 'error.log',
          level: 'error',
          format: getWinstonFormat(false),
        }),
        new winston.transports.File({
          filename: 'combined.log',
          format: getWinstonFormat(false),
        }),
        new winston.transports.Console({
          format: getWinstonFormat(true),
        }),
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: 'exceptions.log',
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
