import { RecordWithPartner } from '../../../../infra/interfaces/interface';
import { SubmissionWithQuestion } from '../../../../infra/interfaces/interface';
import { Window } from '../../../../infra/prisma/generated';

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
