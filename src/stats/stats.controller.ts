import { Controller, Get, UseGuards } from '@nestjs/common';

import { GetUserRest } from '../auth/decorators';
import { JwtRestAdminGuard, JwtRestGuard } from '../auth/guards';

import { AdminStats } from './entities/admin-stats.entity';
import { InterviewStats } from './entities/interview-stats.entity';
import { QuestionStats, TaskStats } from './entities';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('questions')
  @UseGuards(JwtRestGuard)
  async findQuestionStats(
    @GetUserRest('id') userId: string,
  ): Promise<QuestionStats> {
    const latestSubmission = await this.statsService.findLatestSubmission(
      userId,
    );
    const closestWindow = await this.statsService.findClosestWindow();
    const numCompletedThisWindow =
      await this.statsService.findNumQuestionsCompletedThisWindow(
        userId,
        closestWindow,
      );

    return {
      numCompletedThisWindow,
      closestWindow,
      latestSubmission,
    };
  }

  @Get('interviews')
  @UseGuards(JwtRestGuard)
  async findInterviewStats(
    @GetUserRest('id') userId: string,
  ): Promise<InterviewStats> {
    const latestPartner = await this.statsService.findLatestPartner(userId);
    const closestWindow = await this.statsService.findClosestWindow();
    const numCompletedThisWindow =
      await this.statsService.findNumQuestionsCompletedThisWindow(
        userId,
        closestWindow,
      );

    return {
      numCompletedThisWindow,
      closestWindow,
      latestPartner,
    };
  }

  @Get('tasks')
  @UseGuards(JwtRestGuard)
  async findTaskStats(@GetUserRest('id') userId: string): Promise<TaskStats> {
    return this.statsService.findTaskStats(userId);
  }

  @Get('admin')
  @UseGuards(JwtRestAdminGuard)
  async findAdminStats(): Promise<AdminStats> {
    return this.statsService.findAdminStats();
  }
}
