import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';

import { AuthDto } from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: AuthDto): Promise<string> {
    const { token, ...userInfo } = dto;
    const uid = await this.firebaseService.verifyToken(token); // TODO: Look into error handling
    const user = await this.prismaService.user.upsert({
      where: {
        id: uid,
      },
      update: {
        ...userInfo,
      },
      create: {
        id: uid,
        ...userInfo,
      },
    });
    return this.signToken(user.id);
  }

  private signToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwt.signAsync(payload);
  }
}
