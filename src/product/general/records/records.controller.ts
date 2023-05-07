import { Controller, Get, Logger, UseFilters, UseGuards } from '@nestjs/common';

import { BadRequestExceptionFilter } from '../../../utils';
import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { RecordStatsEntity } from './entities';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
  constructor(
    private readonly logger: Logger,
    private readonly recordsService: RecordsService,
  ) {}

  @Get('stats')
  @UseGuards(JwtRestGuard)
  @UseFilters(BadRequestExceptionFilter)
  findStats(@GetUserRest('id') userId: string): Promise<RecordStatsEntity> {
    this.logger.log('GET /records/stats', RecordsController.name);
    return this.recordsService.findStats(userId);
  }
}
