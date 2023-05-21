import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateSlug } from 'random-word-slugs';

import { PrismaService } from '../infra/prisma/prisma.service';

@Injectable()
export class DevService {
  constructor(
    private readonly jwt: JwtService,
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  async login(): Promise<string> {
    const slug = generateSlug();
    const userInfo = {
      id: slug,
      name: 'Dev User',
      githubUsername: slug,
      photoUrl:
        'https://res.cloudinary.com/folio-hnr/image/upload/v1679629122/blob_ycezgh.jpg',
      profileUrl: 'https://github.com',
    };
    const user = await this.prismaService.user.create({ data: userInfo });
    return this.signToken(user.id);
  }

  // Duplicate of AuthService's method of the same name
  private signToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwt.signAsync(payload).catch((e) => {
      this.logger.error(
        'JWT token async signing failed',
        e instanceof Error ? e.stack : undefined,
        DevService.name,
      );
      throw e;
    });
  }
}
