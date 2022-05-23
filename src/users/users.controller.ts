import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { UpdateSettingsDto } from './dtos';
import { UserSettingsConfig } from './entities';
import { UsersService } from './users.service';

@UseGuards(JwtRestGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('self')
  async findSelf(@GetUserRest() user: User): Promise<UserSettingsConfig> {
    const settings = await this.usersService.findSettings(user.id);
    const config = this.usersService.findAppConfig();
    return { ...user, settings, config };
  }

  @Patch('settings')
  updateSettings(
    @GetUserRest() user: User,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserSettingsConfig> {
    return this.usersService.updateSettings(user, dto);
  }
}
