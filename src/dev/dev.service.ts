import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateSlug } from 'random-word-slugs';

import { UpsertUserDto } from '../users/dtos';
import { UsersService } from '../users/users.service';

@Injectable()
export class DevService {
  constructor(
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
    private readonly logger: Logger,
  ) {}

  async login(): Promise<string> {
    const slug = generateSlug();
    const userInfo: UpsertUserDto = {
      id: slug,
      name: 'Dev User',
      githubUsername: slug,
      photoUrl:
        'https://res.cloudinary.com/folio-hnr/image/upload/v1679629122/blob_ycezgh.jpg',
      profileUrl: 'https://github.com',
    };
    const user = await this.usersService.upsertUser(userInfo);
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
