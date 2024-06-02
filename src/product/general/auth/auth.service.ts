import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { FirebaseService } from '../../../productinfra/firebase/firebase.service';

import { UpsertUserData } from './auth.interfaces';
import { AuthDto } from './dtos';

// Exposed for testing
export interface AuthServicePayload {
  sub: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: Logger,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async login(dto: AuthDto): Promise<string> {
    const { token, ...userInfo } = dto;
    // The following operations all may throw an error. We will not catch the errors
    // here and instead let the controller handle it.
    const uid = await this.firebaseService.verifyToken(token);
    const user = await this.upsertUser({ ...userInfo, id: uid });
    return this.signToken(user.id);
  }

  async authenticate(token: string): Promise<User | null> {
    const payload = await this.jwtService
      .verifyAsync<AuthServicePayload>(token)
      .catch((e: unknown) => {
        this.logger.error(
          'Failed to verify token async',
          e instanceof Error ? e.stack : undefined,
          AuthService.name,
        );
        throw new Error('Invalid token');
      });
    return this.prismaService.user.findUnique({ where: { id: payload.sub } });
  }

  private signToken(userId: string): Promise<string> {
    const payload: AuthServicePayload = { sub: userId };
    return this.jwtService.signAsync(payload).catch((e: unknown) => {
      this.logger.error(
        'JWT token async signing failed',
        e instanceof Error ? e.stack : undefined,
        AuthService.name,
      );
      throw e;
    });
  }

  private async upsertUser(entity: UpsertUserData): Promise<User> {
    const settings = await this.prismaService.settings.findUnique({
      where: { userId: entity.id },
    });
    return this.prismaService.user.upsert({
      where: { id: entity.id },
      update: {
        ...entity,
        name: settings?.hasUpdatedName ? undefined : entity.name,
        photoUrl: settings?.hasUpdatedPhoto ? undefined : entity.photoUrl,
      },
      create: { ...entity },
    });
  }
}
