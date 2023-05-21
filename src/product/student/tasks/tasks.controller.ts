import { Controller, Get, Logger, UseFilters, UseGuards } from '@nestjs/common';

import { Cohort } from '../../../infra/prisma/generated';
import { GetUserRest } from '../../../productinfra/decorators';
import { JwtRestStudentGuard } from '../../../productinfra/guards';
import { BadRequestExceptionFilter } from '../../../utils';

import { TaskStatsEntity } from './entities';
import { TasksService } from './tasks.service';

@UseGuards(JwtRestStudentGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly logger: Logger,
    private readonly tasksService: TasksService,
  ) {}

  @Get('cohorts')
  @UseFilters(BadRequestExceptionFilter)
  async findCohorts(): Promise<Cohort[]> {
    this.logger.log('GET /tasks/cohorts', TasksController.name);
    return [];
  }

  @Get('stats')
  @UseFilters(BadRequestExceptionFilter)
  async findStats(@GetUserRest('id') userId: string): Promise<TaskStatsEntity> {
    this.logger.log('GET /tasks/stats', TasksController.name);
    // TODO: Replace with the actual cohort ID
    return this.tasksService.findStats(userId, 1);
  }
}
