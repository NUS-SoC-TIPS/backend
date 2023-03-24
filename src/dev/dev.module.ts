import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';

import { DevController } from './dev.controller';
import { DevService } from './dev.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  providers: [DevService, Logger],
  controllers: [DevController],
})
export class DevModule {}
