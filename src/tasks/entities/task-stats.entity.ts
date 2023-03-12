import { RecordWithPartner } from '../../interfaces/interface';
import { SubmissionWithQuestion } from '../../interfaces/interface';
import { Window } from '../../prisma/generated';

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
