import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthGateway } from './auth.gateway';
import { AuthService } from './auth.service';
import { JwtRestStrategy } from './strategies';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secretOrPrivateKey: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, AuthGateway, JwtRestStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
