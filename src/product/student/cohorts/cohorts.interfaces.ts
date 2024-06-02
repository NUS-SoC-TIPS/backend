import {
  InterviewBase,
  StudentBase,
  SubmissionBase,
  WindowBase,
} from '../../interfaces';

export interface CohortListItem {
  id: number;
  name: string;
  status: 'COMPLETED' | 'FAILED' | 'IN PROGRESS' | 'HAS NOT STARTED';
  startAt: Date | null;
  endAt: Date | null;
}

export interface CohortItem {
  name: string;
  coursemologyUrl: string;
  email: string;
  windows: (WindowBase & {
    exclusion: {
      reason: string; // TODO: Make this an enum
    } | null;
    previouslyExcluded: boolean; // Whether the student was already excluded prior to this window
    hasCompletedQuestions: boolean;
    hasCompletedInterview: boolean;
    submissions: SubmissionBase[];
    interviews: InterviewBase[];
    pairedPartner: StudentBase | null;
  })[];
}
