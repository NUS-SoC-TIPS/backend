import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { PrismaService } from './prisma/prisma.service';
import { AppModule } from './app.module';

const corsOptionsDelegate = (req, callback): void => {
  if (req.baseUrl + req.path === '/code/callback') {
    callback(null, { origin: true });
    return;
  }
  callback(null, {
    origin: process.env.NODE_ENV === 'production' ? /soc-tips\.com$/ : '*',
  });
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: corsOptionsDelegate,
  });
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const prismaService = app.get(PrismaService);
  const configService = app.get(ConfigService);
  await prismaService.enableShutdownHooks(app);
  app.enableCors();
  await app.listen(configService.get('PORT') ?? 3001);
}

bootstrap();
