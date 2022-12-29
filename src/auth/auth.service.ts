import { Injectable, Logger } from '@nestjs/common';
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
    // The following operations all may throw an error. We will not catch the errors
    // here and instead let the controller handle it.
    const uid = await this.firebaseService.verifyToken(token);
    const user = await this.usersService.upsertUser({ ...userInfo, id: uid });
    return this.signToken(user.id);
  }

  private signToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwt.signAsync(payload).catch((e) => {
      this.logger.error(
        'JWT token async signing failed',
        e instanceof Error ? e.stack : undefined,
        AuthService.name,
      );
      throw e;
    });
  }
}
