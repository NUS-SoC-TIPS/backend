import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Settings, User } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { UpdateSettingsDto } from './dtos';
import { UsersService } from './users.service';

@UseGuards(JwtRestGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('self')
  async findSelf(
    @GetUserRest() user: User,
  ): Promise<User & { settings: Settings | null }> {
    const settings = await this.usersService.findSettings(user.id);
    return { ...user, settings };
  }

  @Patch('settings')
  updateSettings(
    @GetUserRest() user: User,
    @Body() dto: UpdateSettingsDto,
  ): Promise<User & { settings: Settings | null }> {
    return this.usersService.updateSettings(user, dto);
  }
}
