import { Injectable } from '@nestjs/common';

import { RecordsService } from '../records/records.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { WindowsService } from '../windows/windows.service';

import { TaskStatsEntity, TaskStatWindowStatus } from './entities';

@Injectable()
export class TasksService {
  constructor(
    private readonly windowsService: WindowsService,
    private readonly submissionsService: SubmissionsService,
    private readonly recordsService: RecordsService,
  ) {}

  async findStats(userId: string): Promise<TaskStatsEntity> {
    // Finding windows may throw. We will not catch here and instead let the
    // controller handle it.
    const windows = await this.windowsService.findCurrentIterationWindows();
    const currentDate = new Date();
    // TODO: Look into whether to batch these queries into a single transaction
    return await Promise.all(
      windows.map(async (window) => {
        // Finding submissions and records may throw. We will not catch here and
        // instead let the controller handle it.
        const submissions = await this.submissionsService.findWithinWindow(
          userId,
          window,
        );
        const records = await this.recordsService.findWithinWindow(
          userId,
          window,
        );
        const hasCompletedQuestions = submissions.length >= window.numQuestions;
        const hasCompletedInterview =
          !window.requireInterview || records.length > 0;
        const status =
          hasCompletedQuestions && hasCompletedInterview
            ? TaskStatWindowStatus.COMPLETED
            : window.endAt < currentDate
            ? TaskStatWindowStatus.FAILED
            : TaskStatWindowStatus.NONE;

        return {
          ...window,
          submissions,
          records,
          hasCompletedQuestions,
          hasCompletedInterview,
          status,
        };
      }),
    );
  }
}
