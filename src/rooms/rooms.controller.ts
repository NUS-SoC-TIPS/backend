import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Room } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { RoomsService } from './rooms.service';

@UseGuards(JwtRestGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  async create(@GetUserRest('id') userId: string): Promise<{ slug: string }> {
    const room = await this.roomsService.create(userId);
    return { slug: room.slug };
  }

  @Get()
  findCurrent(@GetUserRest('id') userId: string): Promise<Room | null> {
    return this.roomsService.findCurrent(userId);
  }
}
