import { StudentBase, UserBase } from '../../interfaces';

export interface InterviewStatsProgress {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numInterviewsThisWindowOrWeek: number;
  isInterviewRequired: boolean | null; // null if not for window
  startOfWindowOrWeek: Date;
  endOfWindowOrWeek: Date;
  isWindow: boolean;
}

export interface InterviewStats {
  progress: InterviewStatsProgress;
  averageDurationMs: number; // 0 if no interviews done
  pairedOrLatestPartner: UserBase | StudentBase | null;
}