import {
  InterviewBase,
  StudentBase,
  StudentBaseWithId,
  SubmissionBase,
  WindowBase,
} from '../../interfaces';

export interface WindowItem extends WindowBase {
  cohortId: number;
  students: (StudentBaseWithId & {
    submissions: SubmissionBase[];
    interviews: InterviewBase[];
    pairedPartner: StudentBase | null;
    hasCompletedWindow: boolean;
    exclusion: {
      id: number;
      reason: string; // TODO: Make this an enum
    } | null;
  })[];
}
