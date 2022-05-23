import { Controller, Get, UseGuards } from '@nestjs/common';

import { GetUserRest } from '../auth/decorators';
import { JwtRestGuard } from '../auth/guards';

import { QuestionStats, TaskStats } from './entities';
import { StatsService } from './stats.service';

@UseGuards(JwtRestGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('questions')
  async findQuestionStats(
    @GetUserRest('id') userId: string,
  ): Promise<QuestionStats> {
    const numCompletedAllTime = await this.statsService.findNumCompletedAllTime(
      userId,
    );
    const closestWindow = await this.statsService.findClosestWindow();
    const numCompletedThisWindow =
      await this.statsService.findNumCompletedThisWindow(userId, closestWindow);

    return {
      numCompletedAllTime,
      numCompletedThisWindow,
      closestWindow,
    };
  }

  @Get('tasks')
  async findTaskStats(@GetUserRest('id') userId: string): Promise<TaskStats> {
    return this.statsService.findTaskStats(userId);
  }
}
