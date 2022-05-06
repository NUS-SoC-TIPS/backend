import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { PrismaService } from './prisma/prisma.service';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  // app.enableCors();
  await app.listen(3001);
}
bootstrap();
