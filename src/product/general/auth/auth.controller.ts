import {
  Body,
  Controller,
  Logger,
  Post,
  UnauthorizedException,
  UseFilters,
} from '@nestjs/common';

import { BadRequestExceptionFilter } from '../../../utils';

import { AuthService } from './auth.service';
import { AuthDto } from './dtos';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly logger: Logger,
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @UseFilters(BadRequestExceptionFilter)
  async login(@Body() dto: AuthDto): Promise<{ token: string }> {
    this.logger.log('POST /auth/login', AuthController.name);
    const token = await this.authService.login(dto).catch(() => {
      throw new UnauthorizedException();
    });
    return { token };
  }
}
