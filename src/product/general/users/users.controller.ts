import {
  Body,
  Controller,
  Get,
  Logger,
  Patch,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { User } from '../../../infra/prisma/generated';
import { BadRequestExceptionFilter } from '../../../utils';
import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { UpdateSettingsDto } from './dtos';
import { UserSettingsConfig } from './entities';
import { UsersService } from './users.service';

@UseGuards(JwtRestGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly logger: Logger,
    private readonly usersService: UsersService,
  ) {}

  @Get('self')
  @UseFilters(BadRequestExceptionFilter)
  async findSelf(@GetUserRest() user: User): Promise<UserSettingsConfig> {
    this.logger.log('GET /users/self', UsersController.name);
    const settings = await this.usersService.findSettings(user.id);
    const config = this.usersService.findAppConfig();
    return { ...user, settings, config };
  }

  @Patch('settings')
  @UseFilters(BadRequestExceptionFilter)
  updateSettings(
    @GetUserRest() user: User,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserSettingsConfig> {
    this.logger.log('PATCH /users/settings', UsersController.name);
    return this.usersService.updateSettings(user, dto);
  }
}