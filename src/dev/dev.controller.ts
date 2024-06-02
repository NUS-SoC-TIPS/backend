import {
  Controller,
  Logger,
  NotFoundException,
  Post,
  UseFilters,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BadRequestExceptionFilter } from '../utils';

import { DevService } from './dev.service';

@Controller('dev')
export class DevController {
  constructor(
    private readonly logger: Logger,
    private readonly devService: DevService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @UseFilters(BadRequestExceptionFilter)
  async login(): Promise<{ token: string }> {
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new NotFoundException();
    }
    this.logger.log('POST /dev/login', DevController.name);
    const token = await this.devService.login();
    return { token };
  }
}
