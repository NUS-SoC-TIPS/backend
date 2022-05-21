import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RoomRecord, User } from '@prisma/client';

import { GetUserRest } from '../auth/decorators';

import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  findPageOfRecords(
    @Param('page', ParseIntPipe) page: number,
    @GetUserRest('id') userId: string,
  ): Promise<{
    records: (RoomRecord & { partner: User })[];
    isLastPage: boolean;
  }> {
    return this.recordsService.findPage(page, userId);
  }
}
