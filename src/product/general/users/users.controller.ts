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
import { SelfUser } from './entities';
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
  async findSelf(@GetUserRest() user: User): Promise<SelfUser> {
    this.logger.log('GET /users/self', UsersController.name);
    return this.usersService.findSelf(user);
  }

  @Patch('settings')
  @UseFilters(BadRequestExceptionFilter)
  updateSettings(
    @GetUserRest() user: User,
    @Body() dto: UpdateSettingsDto,
  ): Promise<void> {
    this.logger.log('PATCH /users/settings', UsersController.name);
    return this.usersService.updateSettings(user, dto);
  }
}
