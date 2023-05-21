import {
  Controller,
  Get,
  Logger,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { GetUserRest } from '../../../productinfra/decorators';
import { JwtRestGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { InterviewsService } from './interviews.service';

@UseGuards(JwtRestGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(
    private readonly logger: Logger,
    private readonly interviewsService: InterviewsService,
  ) {}

  @Post('rooms')
  @UseFilters(BadRequestExceptionFilter)
  async create(@GetUserRest('id') userId: string): Promise<{ slug: string }> {
    this.logger.log('POST /rooms', InterviewsController.name);
    const slug = await this.interviewsService.createRoom(userId);
    return { slug: slug };
  }

  @Get('rooms')
  @UseFilters(BadRequestExceptionFilter)
  async findCurrent(
    @GetUserRest('id') userId: string,
  ): Promise<{ slug: string } | null> {
    this.logger.log('GET /rooms', InterviewsController.name);
    const slug = await this.interviewsService.findCurrentRoom(userId);
    return slug != null ? { slug } : null;
  }
}
