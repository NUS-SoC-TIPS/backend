import {
  Question,
  QuestionSubmission,
  RoomRecord,
  User,
  Window,
} from '@prisma/client';

export interface TaskStatSubmission extends QuestionSubmission {
  question: Question;
}

export interface TaskStatInterview extends RoomRecord {
  partner: User;
}

export enum TaskStatWindowStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NONE = 'NONE',
}

export interface TaskStatWindow extends Window {
  submissions: TaskStatSubmission[];
  interviews: TaskStatInterview[];
  hasCompletedSubmissions: boolean;
  hasCompletedInterview: boolean;
  status: TaskStatWindowStatus;
}

export type TaskStats = TaskStatWindow[];
