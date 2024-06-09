import { ExcuseFrom, ExcuseStatus } from 'src/infra/prisma/generated';

import { UserBase } from './users';
import { WindowBase } from './windows';

export interface ExcuseBase {
  id: number;
  user: UserBase;
  window: WindowBase;
  excuseFrom: ExcuseFrom;
  excuseReason: string;
  status: ExcuseStatus;
}

// Excuse with Student with User and Window
interface ExcuseWithRelations {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  studentId: number;
  windowId: number;
  excuseFrom: ExcuseFrom;
  excuseStatus: ExcuseStatus;
  reason: string;
  student: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    cohortId: number;
    coursemologyName: string;
    coursemologyProfileUrl: string;
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      githubUsername: string;
      photoUrl: string;
      profileUrl: string;
      name: string;
      role: string;
    };
  };
  window: {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    startAt: Date;
    endAt: Date;
    cohortId: number;
    requireInterview: boolean;
    numQuestions: number;
  };
}

export const makeExcuseBase = (excuse: ExcuseWithRelations): ExcuseBase => {
  return {
    id: excuse.id,
    user: {
      name: excuse.student.user.name,
      githubUsername: excuse.student.user.githubUsername,
      profileUrl: excuse.student.user.profileUrl,
      photoUrl: excuse.student.user.photoUrl,
    },
    window: {
      id: excuse.window.id,
      startAt: excuse.window.startAt,
      endAt: excuse.window.endAt,
      numQuestions: excuse.window.numQuestions,
      requireInterview: excuse.window.requireInterview,
    },
    excuseFrom: excuse.excuseFrom,
    excuseReason: excuse.reason,
    status: excuse.excuseStatus,
  };
};
