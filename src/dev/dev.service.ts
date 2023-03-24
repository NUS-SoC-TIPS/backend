import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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
    const userInfo: UpsertUserDto = {
      id: 'devuser806a61a264556518471dccbde32d4d39',
      name: 'Dev User',
      githubUsername: 'devuser',
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
