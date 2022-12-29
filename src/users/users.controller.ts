import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';
import { handleRestError } from '../utils/error.util';

import { UpdateSettingsDto } from './dtos';
import { UserSettingsConfig } from './entities';
import { UsersService } from './users.service';

@UseGuards(JwtRestGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: Logger,
  ) {}
  @Get('self')
  async findSelf(@GetUserRest() user: User): Promise<UserSettingsConfig> {
    this.logger.log('GET /users/self', UsersController.name);
    const settings = await this.usersService
      .findSettings(user.id)
      .catch(handleRestError());
    const config = this.usersService.findAppConfig();
    return { ...user, settings, config };
  }

  @Patch('settings')
  updateSettings(
    @GetUserRest() user: User,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserSettingsConfig> {
    this.logger.log('PATCH /users/settings', UsersController.name);
    return this.usersService.updateSettings(user, dto).catch(handleRestError());
  }
}
