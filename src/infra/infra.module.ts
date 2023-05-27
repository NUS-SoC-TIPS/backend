import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DataModule } from './data/data.module';
import { DateModule } from './date/date.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DataModule,
    DateModule,
    PrismaModule,
  ],
})
export class InfraModule {}
