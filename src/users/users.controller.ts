import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

@UseGuards(JwtRestGuard)
@Controller('users')
export class UsersController {
  @Get('self')
  findSelf(@GetUserRest() user: User): User {
    return user;
  }
}
