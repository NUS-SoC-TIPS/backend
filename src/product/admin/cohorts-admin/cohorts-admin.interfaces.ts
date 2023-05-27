import { StudentBase, WindowBase } from '../../../product/interfaces';

export interface CohortAdminItem {
  id: number;
  name: string;
  coursemologyUrl: string;
  windows: WindowBase[];
  // TODO: Remove this later once a separate query is done
  students: (StudentBase & {
    studentId: number;
    joinedAt: Date;
    isExcluded: boolean;
  })[];
}

export interface CohortAdminUpdateResult {
  name: string;
  coursemologyUrl: string;
}

export interface CohortStudentValidationResult {
  success: StudentBase[];
  error: {
    githubUsername: string;
    coursemologyName: string;
    coursemologyProfileUrl: string;
    error: 'ALREADY ADDED' | 'NOT FOUND' | 'INVALID DATA';
  }[];
}
