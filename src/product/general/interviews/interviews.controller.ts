import {
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { GetUserRest } from '../../../productinfra/decorators';
import { JwtRestGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { InterviewEntity, InterviewStatsEntity } from './entities';
import { InterviewsService } from './interviews.service';

@UseGuards(JwtRestGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(
    private readonly logger: Logger,
    private readonly interviewsService: InterviewsService,
  ) {}

  @Get('stats')
  @UseFilters(BadRequestExceptionFilter)
  findStats(@GetUserRest('id') userId: string): Promise<InterviewStatsEntity> {
    this.logger.log('GET /interviews/stats', InterviewsController.name);
    return this.interviewsService.findStats(userId);
  }

  @Get(':id')
  find(
    @Param('id') id: string,
    @GetUserRest('id') userId: string,
  ): Promise<InterviewEntity> {
    this.logger.log('GET /interviews/:id', InterviewsController.name);
    return this.interviewsService.findInterview(+id, userId);
  }

  @Post('rooms')
  @UseFilters(BadRequestExceptionFilter)
  async create(@GetUserRest('id') userId: string): Promise<{ slug: string }> {
    this.logger.log('POST /interviews/rooms', InterviewsController.name);
    const slug = await this.interviewsService.createRoom(userId);
    return { slug: slug };
  }

  @Get('rooms')
  @UseFilters(BadRequestExceptionFilter)
  async findCurrent(
    @GetUserRest('id') userId: string,
  ): Promise<{ slug: string } | null> {
    this.logger.log('GET /interviews/rooms', InterviewsController.name);
    const slug = await this.interviewsService.findCurrentRoom(userId);
    return slug != null ? { slug } : null;
  }
}
