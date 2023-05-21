import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { User } from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class JwtRestStudentStrategy extends PassportStrategy(
  Strategy,
  'jwt-rest-student',
) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string }): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: payload.sub, students: { some: {} } },
    });
  }
}
