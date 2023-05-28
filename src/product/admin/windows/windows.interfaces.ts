import {
  InterviewBase,
  StudentBaseWithId,
  SubmissionBase,
  WindowBase,
} from '../../interfaces';

export interface WindowItem extends WindowBase {
  cohortId: number;
  students: (StudentBaseWithId & {
    submissions: SubmissionBase[];
    interviews: InterviewBase[];
    exclusion: {
      id: number;
      reason: string; // TODO: Make this an enum
    } | null;
  })[];
}
