import { Controller, Get, Logger, UseFilters, UseGuards } from '@nestjs/common';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';
import { BadRequestExceptionFilter } from '../utils';

import { TaskStatsEntity } from './entities';
import { TasksService } from './tasks.service';

@UseGuards(JwtRestGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly logger: Logger,
    private readonly tasksService: TasksService,
  ) {}

  @Get('stats')
  @UseFilters(BadRequestExceptionFilter)
  async findStats(@GetUserRest('id') userId: string): Promise<TaskStatsEntity> {
    this.logger.log('GET /tasks/stats', TasksController.name);
    return this.tasksService.findStats(userId);
  }
}
