import { Body, Controller, Logger, Post } from '@nestjs/common';

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
    this.logger.log('User logging in...', AuthController.name);
    return { token: await this.authService.login(dto) };
  }
}
