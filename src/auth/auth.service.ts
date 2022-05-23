import { Injectable } from '@nestjs/common';
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
  ) {}

  async login(dto: AuthDto): Promise<string> {
    const { token, ...userInfo } = dto;
    const uid = await this.firebaseService.verifyToken(token); // TODO: Look into error handling
    const user = await this.usersService.upsertUser({ ...userInfo, id: uid });
    return this.signToken(user.id);
  }

  private signToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwt.signAsync(payload);
  }
}
