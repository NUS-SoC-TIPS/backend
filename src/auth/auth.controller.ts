import {
  Body,
  Controller,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthDto } from './dtos';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: Logger,
  ) {}

  @Post('login')
  async login(@Body() dto: AuthDto): Promise<{ token: string }> {
    this.logger.log('POST /auth/login', AuthController.name);
    const token = await this.authService.login(dto).catch(() => {
      throw new UnauthorizedException();
    });
    return { token };
  }
}
