import { Controller, Get, UseGuards } from '@nestjs/common';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { RecordStatsEntity } from './entities';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get('stats')
  @UseGuards(JwtRestGuard)
  findStats(@GetUserRest('id') userId: string): Promise<RecordStatsEntity> {
    return this.recordsService.findStats(userId);
  }
}
