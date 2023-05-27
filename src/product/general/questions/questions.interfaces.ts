import { SubmissionListItem } from '../../interfaces';

export interface QuestionStatsProgress {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numSubmissionsThisWindowOrWeek: number;
  numSubmissionsRequired: number | null; // null if not for window
  startOfWindowOrWeek: Date;
  endOfWindowOrWeek: Date;
  isWindow: boolean;
}

export type QuestionStatsLanguageBreakdown = {
  // Keys are values of the Language enum
  [language: string]: string;
};

export interface QuestionStats {
  progress: QuestionStatsProgress;
  latestSubmission: SubmissionListItem | null;
  // Potentially can reuse for the table
  languageBreakdown: QuestionStatsLanguageBreakdown;
}
