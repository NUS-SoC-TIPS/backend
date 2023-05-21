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
import { GetUserRest } from '../../../productinfra/decorators';
import { JwtRestGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { UpdateSettingsDto } from './dtos';
import { UserWithSettings } from './entities';
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
  async findSelf(@GetUserRest() user: User): Promise<UserWithSettings> {
    const settings = await this.usersService.findSettings(user.id);
    const isStudent = await this.usersService.findIsStudent(user.id);
    return { ...user, settings, isStudent };
  }

  @Patch('settings')
  @UseFilters(BadRequestExceptionFilter)
  updateSettings(
    @GetUserRest() user: User,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserWithSettings> {
    this.logger.log('PATCH /users/settings', UsersController.name);
    return this.usersService.updateSettings(user, dto);
  }
}
