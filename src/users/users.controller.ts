import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';

import { UserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

@UseGuards(JwtRestGuard)
@Controller('users')
export class UsersController {
  @Get('self')
  findSelf(@UserRest() user: User): User {
    return user;
  }
}
