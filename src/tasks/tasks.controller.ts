import { Controller, Get, UseGuards } from '@nestjs/common';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { TaskStatsEntity } from './entities';
import { TasksService } from './tasks.service';

@UseGuards(JwtRestGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('stats')
  async findStats(@GetUserRest('id') userId: string): Promise<TaskStatsEntity> {
    return this.tasksService.findStats(userId);
  }
}
