import { Controller, Get, Logger, UseGuards } from '@nestjs/common';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';
import { handleRestError } from '../utils/error.util';

import { TaskStatsEntity } from './entities';
import { TasksService } from './tasks.service';

@UseGuards(JwtRestGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly logger: Logger,
  ) {}

  @Get('stats')
  async findStats(@GetUserRest('id') userId: string): Promise<TaskStatsEntity> {
    this.logger.log('GET /tasks/stats', TasksController.name);
    return this.tasksService.findStats(userId).catch(handleRestError());
  }
}
