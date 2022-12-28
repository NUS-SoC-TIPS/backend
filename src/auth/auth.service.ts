import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';

import { AuthDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
    private readonly logger: Logger,
  ) {}

  async login(dto: AuthDto): Promise<string> {
    const { token, ...userInfo } = dto;
    const uid = await this.firebaseService
      .verifyToken(token)
      .catch((e: Error) => {
        this.logger.error(
          'Firebase token verification failed',
          e.stack,
          AuthService.name,
        );
        throw new UnauthorizedException();
      });

    const user = await this.usersService.upsertUser({ ...userInfo, id: uid });
    const signedToken = await this.signToken(user.id).catch((e: Error) => {
      this.logger.error('JWT token signing failed', e.stack, AuthService.name);
      throw new UnauthorizedException();
    });

    return signedToken;
  }

  private signToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwt.signAsync(payload);
  }
}
