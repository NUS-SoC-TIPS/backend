import {
  InterviewBase,
  StudentBase,
  SubmissionBase,
  WindowBase,
} from '../../interfaces';

export interface WindowItem extends WindowBase {
  students: (StudentBase & {
    studentId: number;
    coursemologyName: string;
    submissions: SubmissionBase[];
    interviews: InterviewBase[];
    exclusion: {
      id: number;
      reason: string; // TODO: Make this an enum
    } | null;
  })[];
}
