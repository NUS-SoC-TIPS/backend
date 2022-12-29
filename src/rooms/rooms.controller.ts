import {
  Controller,
  Get,
  Logger,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Room } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';
import { BadRequestExceptionFilter } from '../utils';

import { RoomsService } from './rooms.service';

@UseGuards(JwtRestGuard)
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly logger: Logger,
  ) {}

  @Post()
  @UseFilters(BadRequestExceptionFilter)
  async create(@GetUserRest('id') userId: string): Promise<{ slug: string }> {
    this.logger.log('POST /rooms', RoomsController.name);
    const room = await this.roomsService.create(userId);
    return { slug: room.slug };
  }

  @Get()
  @UseFilters(BadRequestExceptionFilter)
  findCurrent(@GetUserRest('id') userId: string): Promise<Room | null> {
    this.logger.log('GET /rooms', RoomsController.name);
    return this.roomsService.findCurrent(userId);
  }
}
