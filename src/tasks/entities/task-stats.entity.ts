import { Window } from '@prisma/client';

import { RecordWithPartner } from '../../interfaces/interface';
import { SubmissionWithQuestion } from '../../interfaces/interface';

export enum TaskStatWindowStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NONE = 'NONE',
}

export interface TaskStatWindow extends Window {
  submissions: SubmissionWithQuestion[];
  records: RecordWithPartner[];
  hasCompletedInterview: boolean;
  hasCompletedQuestions: boolean;
  status: TaskStatWindowStatus;
}

export type TaskStatsEntity = TaskStatWindow[];
